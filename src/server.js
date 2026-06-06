require('dotenv').config();

// Environment Validation Check
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('CRITICAL CONFIGURATION ERROR: Missing required environment variables (DATABASE_URL and JWT_SECRET).');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const cron = require('node-cron');
const { verifyToken } = require('./middleware/auth');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'manar_secret_key';

let prisma;
try {
  const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/manardb?schema=public";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.error('[DATABASE] Failed to initialize Prisma Client with Driver Adapter:', err.message);
  prisma = new Proxy({}, {
    get: () => {
      throw new Error('Database is offline / Prisma Client not initialized.');
    }
  });
}

// ==========================================
// NOTIFICATION ENGINE: CRON JOBS
// ==========================================
// Schedule: Runs every day at 20:00 (8:00 PM)
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Executing 8:00 PM Daily Schedule Summary for all groups...');
  try {
    const pendingNotifications = await prisma.notificationLog.findMany({
      where: { status: 'PENDING' }
    });

    for (const log of pendingNotifications) {
      console.log(`[CRON] Dispatching alert message to Group ID ${log.groupId || 'All'}: "${log.message}"`);
      
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: 'SENT', sentTime: new Date() }
      });
    }

    console.log(`[CRON] Daily notifications processed successfully. Count: ${pendingNotifications.length}`);
  } catch (error) {
    console.error('[CRON] Error processing daily notifications:', error);
  }
});

// ==========================================
// API ENDPOINTS (Foundations & Authentication)
// ==========================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Manar Schedule System Backend is running.' });
});

// Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // 1. Try to find user in database
    let user = null;
    let role = null;
    let groupId = null;

    try {
      // Check Admin first
      const adminUser = await prisma.admin.findUnique({ where: { email } });
      if (adminUser) {
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (isMatch) {
          user = adminUser;
          role = 'ADMIN';
        }
      }

      if (!user) {
        // Check Student
        const studentUser = await prisma.student.findUnique({ where: { email } });
        if (studentUser) {
          const isMatch = await bcrypt.compare(password, studentUser.password);
          if (isMatch) {
            user = studentUser;
            role = 'STUDENT';
            groupId = studentUser.groupId;
          }
        }
      }
    } catch (dbError) {
      console.warn('Database offline/not seeded, falling back to sandbox credentials.');
    }

    // 2. Local sandbox fallback credentials for testing/demo
    if (!user) {
      if (email === 'admin@manar.edu' && password === 'admin123') {
        user = { id: 999, name: 'Admin Sandbox', email: 'admin@manar.edu' };
        role = 'ADMIN';
      } else if (email === 'student@manar.edu' && password === 'student123') {
        user = { id: 888, name: 'Student Sandbox', email: 'student@manar.edu' };
        role = 'STUDENT';
        groupId = 1; // Default Group A
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // 3. Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, role, groupId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        groupId
      }
    });

  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
});

// 1. GET ALL SCHEDULES (With active overrides)
app.get('/api/schedules', async (req, res) => {
  try {
    const { groupId } = req.query;
    
    const schedules = await prisma.schedule.findMany({
      where: groupId ? { groupId: parseInt(groupId) } : {},
      include: {
        subject: true,
        room: true,
        group: true,
        overrides: {
          where: { date: { gte: new Date() } } // Fetch only relevant future overrides
        }
      }
    });
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error('[API] Error fetching schedules:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
  }
});

// 2. POST OVERRIDE (Protected: Drag & Drop Exception Handler + Notification Trigger)
app.post('/api/schedules/override', verifyToken, async (req, res) => {
  try {
    // Role Authorization Check
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can modify schedules' });
    }

    const { scheduleId, newStartTime, newEndTime, newRoomId, date, overrideType } = req.body;

    // A. Save the override in the database
    const override = await prisma.scheduleOverride.create({
      data: {
        scheduleId: parseInt(scheduleId),
        newStartTime,
        newEndTime,
        newRoomId: newRoomId ? parseInt(newRoomId) : null,
        date: new Date(date),
        overrideType // 'TEMPORARY' or 'PERMANENT'
      },
      include: {
        schedule: {
          include: { subject: true, group: true }
        }
      }
    });

    // B. Trigger the Targeted Notification Log for the specific Group
    const alertMessage = `تنبيه طارئ: تم تعديل محاضرة ${override.schedule.subject.name} الخاصة بـ ${override.schedule.group.name}. يرجى مراجعة الجدول.`;
    
    await prisma.notificationLog.create({
      data: {
        groupId: override.schedule.groupId,
        message: alertMessage,
        status: 'PENDING' // Cron job will pick this up
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Schedule overridden and targeted notification queued successfully.',
      data: override 
    });

  } catch (error) {
    console.error('[API] Error creating override:', error);
    res.status(500).json({ success: false, error: 'Failed to create override' });
  }
});

// 3. POST NEW BASE SCHEDULE (Protected: Manual Schedule Entry)
app.post('/api/schedules', verifyToken, async (req, res) => {
  try {
    // Role Authorization Check
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can add schedules' });
    }

    const {
      subjectName,
      subjectCode,
      subjectType,
      roomName,
      roomCapacity,
      lecturerName,
      groupName,
      dayOfWeek,
      startTime,
      endTime
    } = req.body;

    if (!subjectName || !subjectCode || !subjectType || !roomName || !lecturerName || !groupName || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'Missing required schedule fields' });
    }

    const upperSubjectType = subjectType.toUpperCase();
    if (upperSubjectType !== 'THEORY' && upperSubjectType !== 'PRACTICAL') {
      return res.status(400).json({ success: false, error: 'Invalid subject type. Must be THEORY or PRACTICAL.' });
    }

    const upperDayOfWeek = dayOfWeek.toUpperCase();
    const validDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    if (!validDays.includes(upperDayOfWeek)) {
      return res.status(400).json({ success: false, error: 'Invalid day of week. Must be one of: ' + validDays.join(', ') });
    }

    // A. Find or create Subject
    const subject = await prisma.subject.upsert({
      where: { code: subjectCode },
      update: { name: subjectName, type: upperSubjectType },
      create: { name: subjectName, code: subjectCode, type: upperSubjectType }
    });

    // B. Find or create Room
    const room = await prisma.room.upsert({
      where: { name: roomName },
      update: { capacity: parseInt(roomCapacity) || 45 },
      create: { name: roomName, capacity: parseInt(roomCapacity) || 45 }
    });

    // C. Find or create Group
    let group = await prisma.group.findFirst({
      where: { name: groupName }
    });
    if (!group) {
      group = await prisma.group.create({
        data: { name: groupName }
      });
    }

    // D. Save the new base schedule
    const newSchedule = await prisma.schedule.create({
      data: {
        subjectId: subject.id,
        roomId: room.id,
        groupId: group.id,
        lecturerName,
        dayOfWeek: upperDayOfWeek,
        startTime,
        endTime
      },
      include: {
        subject: true,
        room: true,
        group: true,
        overrides: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Base schedule created successfully.',
      data: newSchedule
    });

  } catch (error) {
    console.error('[API] Error creating base schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to create base schedule' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Smart Notification Engine (Cron) is initialized.');
});
