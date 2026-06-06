const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
// const admin = require('firebase-admin'); // To be initialized later with service account

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// NOTIFICATION ENGINE: CRON JOBS
// ==========================================
// Schedule: Runs every day at 20:00 (8:00 PM)
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Executing 8:00 PM Daily Schedule Summary for all groups...');
  try {
    // Logic to fetch tomorrow's schedules & overrides per group will go here
    // Logic to send notifications via Firebase will go here
    console.log('[CRON] Daily notifications processed successfully.');
  } catch (error) {
    console.error('[CRON] Error processing daily notifications:', error);
  }
});

// ==========================================
// API ENDPOINTS (Foundations)
// ==========================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Manar Schedule System Backend is running.' });
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

// 2. POST OVERRIDE (Drag & Drop Exception Handler + Notification Trigger)
app.post('/api/schedules/override', async (req, res) => {
  try {
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
        status: 'PENDING' // Cron job or Firebase worker will pick this up
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Smart Notification Engine (Cron) is initialized.');
});
