# 🏫 Al-Manar University Schedule & Academic Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-5A67D8.svg)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

> A production-ready, full-stack academic schedule management system designed for **Al-Manar University**. Features dynamic class timetables, real-time schedule overrides, automated WhatsApp notification digests, CAPTCHA-protected authentication, and multi-portal role-based access control (RBAC).

---

## 🖼️ Application Dashboards & Visual Interfaces

### 1. Student Academic Schedule Dashboard
![Student Timetable Dashboard](docs/images/schedule_dashboard.png)
*Figure 1: Responsive student schedule portal displaying color-coded weekly class timetables, room numbers, instructor details, and real-time override alerts.*

---

### 2. Administrator & System Management Overview
![Admin Portal Overview](docs/images/portal_overview.png)
*Figure 2: Super Admin control panel for managing schedules, broadcasting notifications, managing student enrollments, and inspecting automated notification logs.*

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    Client[React + Vite Frontend] -->|HTTPS REST API| Express[Express Node.js Backend Gateway]
    Express --> Auth[JWT + CAPTCHA Auth Middleware]
    Express --> RBAC[Role-Based Access Control]
    Express --> Cron[Cron Scheduler & WhatsApp Digest]
    
    Express --> Prisma[Prisma ORM Layer]
    Prisma --> DB[(PostgreSQL Database)]
```

---

## 🌟 Key Features

- 📅 **Dynamic Schedule Engine**: Real-time weekly timetable rendering, instructor assignments, and room allocation.
- ⚡ **Instant Schedule Overrides**: Administrative override controls with automated notification alerts.
- 📲 **Automated Notifications**: Scheduled daily digests via WhatsApp/Cron integration.
- 🔒 **Enterprise Authentication**: JWT sessions, secure password hashing, and CAPTCHA verification challenges.
- 👥 **Multi-Portal RBAC**: Distinct interfaces for Students, Administrators, and Super Administrators.

---

## 🛠️ Quick Start & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mghalaosimi-web/manar-schedule-system.git
cd manar-schedule-system
npm install
```

### 2. Configure Environment Variables
Create `.env` in `backend/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/manar_schedule_db"
JWT_SECRET="your_production_secure_jwt_secret_key"
PORT=5000
NODE_ENV="development"
```

### 3. Database Migration & Seeding
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Application
```bash
# Run both backend & frontend concurrently from root
npm run dev
```

---

## 📁 Project Architecture

```
manar-schedule-system/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server entry point
│   │   ├── middleware/        # JWT & CAPTCHA auth middlewares
│   │   └── routes/            # Schedules, Auth, and Admin API endpoints
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Initial dataset seed
├── docs/images/               # UI Screenshots & diagrams
│   ├── schedule_dashboard.png
│   └── portal_overview.png
├── frontend/                  # React + Vite client UI
└── package.json               # Full-stack workspace orchestrator
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Student & Admin login | Public |
| **POST** | `/api/auth/verify` | Phone / Email verification | Public |
| **GET** | `/api/schedules` | Retrieve active schedules | Authenticated |
| **POST** | `/api/schedules/override` | Create schedule override | Admin |
| **GET** | `/api/admin/metrics` | System analytics & audit logs | Super Admin |

---

## 📄 License

This project is licensed under the ISC License.
