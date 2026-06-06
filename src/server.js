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

    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(scheduleId) }
    });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = days[new Date(date).getDay()];
    const targetRoomId = newRoomId ? parseInt(newRoomId) : schedule.roomId;
    const targetStartTime = newStartTime || schedule.startTime;

    const clash = await prisma.schedule.findFirst({
      where: {
        dayOfWeek,
        startTime: targetStartTime,
        id: { not: parseInt(scheduleId) },
        OR: [{ roomId: targetRoomId }, { lecturerName: schedule.lecturerName }]
      }
    });
    if (clash) {
      return res.status(409).json({ success: false, error: 'Conflict: Room or Lecturer already assigned to another class during this time slot.' });
    }

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

    // D. Check for schedule conflicts
    const clash = await prisma.schedule.findFirst({
      where: {
        dayOfWeek: upperDayOfWeek,
        startTime,
        OR: [{ roomId: room.id }, { lecturerName }]
      }
    });
    if (clash) {
      return res.status(409).json({ success: false, error: 'Conflict: Room or Lecturer already assigned to another class during this time slot.' });
    }

    // E. Save the new base schedule
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

// ==========================================
// GROUPS CRUD
// ==========================================
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    console.error('[API] Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

app.post('/api/groups', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { id, name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    let group;
    if (id) {
      group = await prisma.group.update({
        where: { id: parseInt(id) },
        data: { name }
      });
    } else {
      group = await prisma.group.create({
        data: { name }
      });
    }
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('[API] Error saving group:', error);
    res.status(500).json({ success: false, error: 'Failed to save group' });
  }
});

app.delete('/api/groups/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { id } = req.params;

    const scheduleCount = await prisma.schedule.count({
      where: { groupId: parseInt(id) }
    });
    const studentCount = await prisma.student.count({
      where: { groupId: parseInt(id) }
    });
    const logCount = await prisma.notificationLog.count({
      where: { groupId: parseInt(id) }
    });

    if (scheduleCount > 0 || studentCount > 0 || logCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete group: It is currently assigned to schedules, students, or notification logs.'
      });
    }

    await prisma.group.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('[API] Error deleting group:', error);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
});

// ==========================================
// ROOMS CRUD
// ==========================================
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error('[API] Error fetching rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
});

app.post('/api/rooms', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { id, name, capacity } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ success: false, error: 'Room name and capacity are required' });
    }

    let room;
    if (id) {
      room = await prisma.room.update({
        where: { id: parseInt(id) },
        data: { name, capacity: parseInt(capacity) }
      });
    } else {
      room = await prisma.room.create({
        data: { name, capacity: parseInt(capacity) }
      });
    }
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('[API] Error saving room:', error);
    res.status(500).json({ success: false, error: 'Failed to save room' });
  }
});

app.delete('/api/rooms/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { id } = req.params;

    const scheduleCount = await prisma.schedule.count({
      where: { roomId: parseInt(id) }
    });
    const overrideCount = await prisma.scheduleOverride.count({
      where: { newRoomId: parseInt(id) }
    });

    if (scheduleCount > 0 || overrideCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete room: It is currently assigned to active schedules or overrides.'
      });
    }

    await prisma.room.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('[API] Error deleting room:', error);
    res.status(500).json({ success: false, error: 'Failed to delete room' });
  }
});

// ==========================================
// METRICS, BROADCASTS & SETTINGS ENDPOINTS
// ==========================================
app.get('/api/admin/metrics', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const students = await prisma.student.count();
    const schedules = await prisma.schedule.count();
    const departments = await prisma.department.count();
    const rooms = await prisma.room.count();

    res.status(200).json({
      success: true,
      data: { students, lectures: schedules, departments, classrooms: rooms }
    });
  } catch (error) {
    console.error('[API] Error fetching metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

app.post('/api/broadcasts', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { groupId, message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const parsedGroupId = groupId === 'ALL' || !groupId ? null : parseInt(groupId);

    const log = await prisma.notificationLog.create({
      data: {
        groupId: parsedGroupId,
        message,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('[API] Error creating broadcast:', error);
    res.status(500).json({ success: false, error: 'Failed to create broadcast' });
  }
});

app.get('/api/admin/logs', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const logs = await prisma.notificationLog.findMany({
      include: {
        group: true
      },
      orderBy: {
        sentTime: 'desc'
      }
    });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('[API] Error fetching logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

app.delete('/api/admin/logs', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    await prisma.notificationLog.deleteMany({});
    res.status(200).json({ success: true, message: 'All logs cleared successfully' });
  } catch (error) {
    console.error('[API] Error clearing logs:', error);
    res.status(500).json({ success: false, error: 'Failed to clear logs' });
  }
});

app.get('/api/notifications/student', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const logs = await prisma.notificationLog.findMany({
      where: {
        OR: [
          { groupId: req.user.groupId },
          { groupId: null }
        ]
      },
      include: {
        group: true
      },
      orderBy: {
        sentTime: 'desc'
      }
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('[API] Error fetching student notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student notifications' });
  }
});

app.put('/api/student/settings', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const { name, password, groupId, departmentName, levelName } = req.body;
    const studentId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (groupId) updateData.groupId = parseInt(groupId);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (departmentName) {
      let major = await prisma.major.findFirst({
        where: { name: departmentName }
      });
      if (!major) {
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { name: 'Engineering & IT' }
          });
        }
        major = await prisma.major.create({
          data: { name: departmentName, departmentId: dept.id }
        });
      }
      updateData.majorId = major.id;
    }

    if (levelName) {
      let level = await prisma.level.findFirst({
        where: { name: levelName }
      });
      if (!level) {
        level = await prisma.level.create({
          data: { name: levelName }
        });
      }
      updateData.levelId = level.id;
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        major: true,
        level: true,
        group: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Student preferences and profile updated successfully.',
      data: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        groupId: updatedStudent.groupId,
        role: 'STUDENT',
        groupName: updatedStudent.group.name,
        majorName: updatedStudent.major.name,
        levelName: updatedStudent.level.name
      }
    });
  } catch (error) {
    console.error('[API] Error updating student settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Smart Notification Engine (Cron) is initialized.');
});
