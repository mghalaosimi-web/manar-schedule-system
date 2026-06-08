require('dotenv').config();

// Environment Validation Check
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('CRITICAL CONFIGURATION ERROR: Missing required environment variables (DATABASE_URL and JWT_SECRET).');
  process.exit(1);
}

const express = require('express');
const path = require('path');
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

const JWT_SECRET = process.env.JWT_SECRET;

// Initialize global PG Pool and Prisma Client singletons to prevent connection leaks
if (!global.pgPool) {
  const connectionString = process.env.DATABASE_URL;
  global.pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false }
  });
}

if (!global.prisma) {
  const adapter = new PrismaPg(global.pgPool);
  global.prisma = new PrismaClient({ adapter });
}
const prisma = global.prisma;

// Self-healing database check & migrations
async function runStartupMigrations() {
  try {
    console.log('[DATABASE] Running self-healing schema checks...');
    // Create enums if they don't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN
          CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');
        END IF;
      END$$;
    `).catch(() => { });

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationType') THEN
          CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE');
        END IF;
      END$$;
    `).catch(() => { });

    // Create VerificationCode table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VerificationCode" (
        "id" SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL,
        "code" TEXT NOT NULL,
        "type" "VerificationType" NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL
      );
    `).catch(() => { });

    // Ensure all dynamic columns exist
    await prisma.$executeRawUnsafe('ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "role" "AdminRole" DEFAULT \'ADMIN\';').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "idNumber" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "idPhotoUrl" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "phone" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN DEFAULT false;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "isPhoneVerified" BOOLEAN DEFAULT false;').catch(() => { });

    console.log('[DATABASE] Table schema fields migrated successfully.');

    // Check & add foreign key constraint if it doesn't exist
    const fkeyCheck = await prisma.$queryRawUnsafe(`
      SELECT conname FROM pg_constraint WHERE conname = 'VerificationCode_studentId_fkey'
    `);
    if (fkeyCheck.length === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VerificationCode" 
        ADD CONSTRAINT "VerificationCode_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
      `).catch(() => { });
    }

    // Check & add unique constraints
    const idNumCheck = await prisma.$queryRawUnsafe(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'Student_idNumber_key' OR conname = 'Student_idNumber_unique'
    `);
    if (idNumCheck.length === 0) {
      console.log('[DATABASE] Adding unique constraint on Student.idNumber...');
      await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD CONSTRAINT "Student_idNumber_key" UNIQUE ("idNumber")').catch(() => { });
    }

    const phoneCheck = await prisma.$queryRawUnsafe(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'Student_phone_key' OR conname = 'Student_phone_unique'
    `);
    if (phoneCheck.length === 0) {
      console.log('[DATABASE] Adding unique constraint on Student.phone...');
      await prisma.$executeRawUnsafe('ALTER TABLE "Student" ADD CONSTRAINT "Student_phone_key" UNIQUE ("phone")').catch(() => { });
    }

    console.log('[DATABASE] All database constraints checked/applied.');
  } catch (err) {
    console.warn('[DATABASE] Startup migration issue:', err.message);
  }
}

// Database startup, migrations, seeding, and port binding sequencing
async function boot() {
  try {
    console.log('[DATABASE] Connecting to PostgreSQL via Prisma Client...');
    await prisma.$connect();
    console.log('[DATABASE] Connected to PostgreSQL via Prisma Client.');

    await runStartupMigrations();

    // Execute seed script and print logs directly to console output
    const { exec } = require('child_process');
    exec('node prisma/seed.js', (err, stdout, stderr) => {
      if (err) {
        console.error('[DATABASE] Seeding process failed:', err.message);
        console.error(stderr);
      } else {
        console.log('[DATABASE] Seeding completed successfully.');
        if (stdout) console.log(stdout);
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Smart Notification Engine (Cron) is initialized.');
    });
  } catch (err) {
    console.error('[DATABASE] Critical database connection error:', err.message);
    process.exit(1);
  }
}

boot();

// ==========================================
// NOTIFICATION ENGINE: CRON JOBS
// ==========================================
// Schedule: Runs every day at 20:00 (8:00 PM)
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Executing 8:00 PM Daily Schedule Summary for all groups...');
  try {
    // 1. Determine tomorrow's day of week
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const tomorrowDayName = days[tomorrow.getDay()];

    // Start and end of tomorrow for date comparison
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Fetch all groups
    const groups = await prisma.group.findMany();

    for (const group of groups) {
      // Find base schedules for this group for tomorrow's day
      const schedules = await prisma.schedule.findMany({
        where: {
          groupId: group.id,
          dayOfWeek: tomorrowDayName
        },
        include: {
          subject: true,
          room: true
        }
      });

      const tomorrowClasses = [];

      for (const schedule of schedules) {
        // Find overrides for tomorrow's date
        const override = await prisma.scheduleOverride.findFirst({
          where: {
            scheduleId: schedule.id,
            date: {
              gte: tomorrowStart,
              lte: tomorrowEnd
            }
          },
          include: {
            newRoom: true
          }
        });

        let startTime = schedule.startTime;
        let endTime = schedule.endTime;
        let roomName = schedule.room.name;

        if (override) {
          startTime = override.newStartTime || startTime;
          endTime = override.newEndTime || endTime;
          roomName = override.newRoom ? override.newRoom.name : roomName;
        }

        tomorrowClasses.push({
          subject: schedule.subject.name,
          code: schedule.subject.code,
          lecturer: schedule.lecturerName,
          startTime,
          endTime,
          room: roomName,
          isOverride: !!override
        });
      }

      let messageAr = '';
      let messageEn = '';

      if (tomorrowClasses.length > 0) {
        messageEn = `Tomorrow's Schedule Summary for ${group.name}:\n`;
        messageAr = `ملخص جدول الغد لشعبة ${group.name}:\n`;

        tomorrowClasses.forEach((c, idx) => {
          messageEn += `${idx + 1}. ${c.subject} (${c.code}) with Dr. ${c.lecturer} in Room ${c.room} [${c.startTime} - ${c.endTime}]${c.isOverride ? ' (UPDATED)' : ''}\n`;
          messageAr += `${idx + 1}. ${c.subject} (${c.code}) مع د. ${c.lecturer} في قاعة ${c.room} [${c.startTime} - ${c.endTime}]${c.isOverride ? ' (تم التحديث)' : ''}\n`;
        });
      } else {
        messageEn = `No classes scheduled for tomorrow for ${group.name}. Enjoy your day off!`;
        messageAr = `لا توجد محاضرات مجدولة للغد لشعبة ${group.name}. استمتع بيومك!`;
      }

      // Combine messages
      const alertMessage = `${messageAr}\n${messageEn}`;

      await prisma.notificationLog.create({
        data: {
          groupId: group.id,
          message: alertMessage,
          status: 'SENT',
          sentTime: new Date()
        }
      });
    }

    // 2. Also process any other PENDING notifications and set their status to SENT
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

    console.log(`[CRON] Daily notifications and summaries processed successfully. Groups: ${groups.length}, Pending: ${pendingNotifications.length}`);
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

// In-memory CAPTCHA challenge store
const captchaStore = new Map();

// CAPTCHA Generator Endpoint
app.get('/api/auth/captcha', (req, res) => {
  const challengeId = Math.random().toString(36).substring(2, 15);
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;

  // Store the correct answer (expire in 5 minutes)
  captchaStore.set(challengeId, { answer, expires: Date.now() + 5 * 60 * 1000 });

  res.status(200).json({
    success: true,
    challengeId,
    question: `What is ${num1} + ${num2}?`
  });
});

// Student Registration Endpoint (Simplified - OTP-free, Auto-login)
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      fullName, email, password, phone, idNumber, idPhotoUrl,
      majorId, levelId, groupId, captchaAnswer, captchaChallengeId
    } = req.body;

    if (!fullName || !email || !password || !phone || !idNumber || !majorId || !levelId || !groupId) {
      return res.status(400).json({ success: false, error: 'All fields except ID Photo URL are required' });
    }

    // CAPTCHA validation
    const captcha = captchaStore.get(captchaChallengeId);
    if (!captcha || captcha.expires < Date.now() || parseInt(captchaAnswer) !== captcha.answer) {
      return res.status(400).json({ success: false, error: 'Human verification (CAPTCHA) failed or expired.' });
    }
    captchaStore.delete(captchaChallengeId); // Cleanup challenge after use

    // Check if email already registered
    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
      return res.status(400).json({ success: false, error: 'Email address is already registered' });
    }

    // Check if Phone already registered
    const existingPhone = await prisma.student.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ success: false, error: 'Phone number is already registered' });
    }

    // Check if ID Number already registered
    const existingIdNumber = await prisma.student.findUnique({ where: { idNumber } });
    if (existingIdNumber) {
      return res.status(400).json({ success: false, error: 'ID Number is already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the student profile (fully verified immediately)
    const student = await prisma.student.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        phone,
        idNumber,
        idPhotoUrl: idPhotoUrl || null,
        majorId: parseInt(majorId),
        levelId: parseInt(levelId),
        groupId: parseInt(groupId),
        isEmailVerified: true,
        isPhoneVerified: true
      }
    });

    // Sign a 90-day JWT token for auto-login
    const token = jwt.sign(
      { id: student.id, name: student.name, role: 'STUDENT', groupId: student.groupId },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered and logged in successfully.',
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'STUDENT',
        groupId: student.groupId
      }
    });

  } catch (error) {
    console.error('[API] Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
});

// Triple Verification Endpoint (Accepts code, type, identifier)
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { identifier, code, type } = req.body; // type is 'EMAIL' or 'PHONE'

    if (!identifier || !code || !type) {
      return res.status(400).json({ success: false, error: 'Identifier, code, and verification type are required' });
    }

    if (type !== 'EMAIL' && type !== 'PHONE') {
      return res.status(400).json({ success: false, error: 'Invalid verification type' });
    }

    // Find student
    let student;
    if (type === 'EMAIL') {
      student = await prisma.student.findUnique({ where: { email: identifier } });
    } else {
      student = await prisma.student.findUnique({ where: { phone: identifier } });
    }

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    // Find valid verification code
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        studentId: student.id,
        code,
        type,
        expiresAt: { gte: new Date() }
      }
    });

    if (!validCode) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }

    // Delete the verified code
    await prisma.verificationCode.delete({ where: { id: validCode.id } });

    // Update verified status
    const updateData = type === 'EMAIL' ? { isEmailVerified: true } : { isPhoneVerified: true };
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: updateData
    });

    // Check if both verification steps are satisfied
    if (updatedStudent.isEmailVerified && updatedStudent.isPhoneVerified) {
      // Generate 90-day long-lived JWT token for persistent login
      const token = jwt.sign(
        { id: updatedStudent.id, name: updatedStudent.name, role: 'STUDENT', groupId: updatedStudent.groupId },
        JWT_SECRET,
        { expiresIn: '90d' }
      );

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Account fully verified and activated.',
        token,
        user: {
          id: updatedStudent.id,
          name: updatedStudent.name,
          email: updatedStudent.email,
          role: 'STUDENT',
          groupId: updatedStudent.groupId
        }
      });
    }

    res.status(200).json({
      success: true,
      verified: false,
      message: `${type} verification completed. Pending remaining step.`
    });

  } catch (error) {
    console.error('[API] Verification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
});

// Developer God Mode: Student Impersonation Endpoint (Protected by SUPER_ADMIN role only)
app.post('/api/auth/impersonate', verifyToken, async (req, res) => {
  try {
    // Only SUPER_ADMIN can impersonate
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Developer God Mode is reserved for Super Admins only' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: { group: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Sign a new token as the student (bypassing password)
    const token = jwt.sign(
      { id: student.id, name: student.name, role: 'STUDENT', groupId: student.groupId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'STUDENT',
        groupId: student.groupId,
        groupName: student.group.name
      }
    });

  } catch (error) {
    console.error('[API] Impersonation error:', error);
    res.status(500).json({ success: false, error: 'Failed to impersonate student' });
  }
});

// GET all departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error('[API] Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

// GET all majors (with optional departmentId filter)
app.get('/api/majors', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = departmentId ? { departmentId: parseInt(departmentId) } : {};
    const majors = await prisma.major.findMany({
      where: filter,
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: majors });
  } catch (error) {
    console.error('[API] Error fetching majors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch majors' });
  }
});

// GET all levels
app.get('/api/levels', async (req, res) => {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: levels });
  } catch (error) {
    console.error('[API] Error fetching levels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch levels' });
  }
});

// God Mode - Get Metrics (Protected: SUPER_ADMIN only)
app.get('/api/admin/god-mode/metrics', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. Super Admin role required.' });
    }

    const totalStudents = await prisma.student.count();

    // Group by major
    const majorsData = await prisma.major.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    const studentsByMajor = majorsData.map(m => ({
      name: m.name,
      count: m._count.students
    }));

    // Group by level
    const levelsData = await prisma.level.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    const studentsByLevel = levelsData.map(l => ({
      name: l.name,
      count: l._count.students
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        studentsByMajor,
        studentsByLevel
      }
    });
  } catch (error) {
    console.error('[API] God Mode metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve system metrics' });
  }
});

// God Mode - Get All Students with details (Protected: SUPER_ADMIN only)
app.get('/api/admin/god-mode/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. Super Admin role required.' });
    }

    const students = await prisma.student.findMany({
      include: {
        major: true,
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('[API] God Mode students fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve students list' });
  }
});

// God Mode - Delete Student (Protected: SUPER_ADMIN only)
app.delete('/api/admin/god-mode/students/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. Super Admin role required.' });
    }

    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, error: 'Invalid Student ID' });
    }

    await prisma.student.delete({
      where: { id: studentId }
    });

    res.status(200).json({ success: true, message: 'Student successfully purged.' });
  } catch (error) {
    console.error('[API] God Mode delete student error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

// GET all students (Protected: Admins/Super Admins only)
app.get('/api/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const students = await prisma.student.findMany({
      include: {
        major: { include: { department: true } },
        level: true,
        group: true
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('[API] Error fetching students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    const alertMessage = `تنبيه طارئ: تم تعديل محاضرة ${override.schedule.subject.name} الخاصة بـ ${override.schedule.group.name}. يرجى مراجعة الجدول المحدث.`;
    
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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


// ==========================================
// STATIC SERVING & ROUTING FOR SPA
// ==========================================

// Serve static files from the React frontend app build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle invalid API routes without wildcards
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Catch-all for React SPA without wildcards
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    next();
  }
});

// ==========================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  // Catch ENOENT (File Not Found) errors for missing static assets
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }

  // Fallback for non-API requests
  res.status(500).sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

