# Implementation Plan - Student Registration & Super Admin Impersonation

This plan outlines the changes required to upgrade the database schema, implement backend authentication & impersonation endpoints, seed the super administrator account, create the frontend registration form, update the login view, and build the student directory with the "Log in as student" developer impersonation feature.

## User Review Required

> [!IMPORTANT]
> The database migration will add `idNumber` (Mandatory, unique) and `idPhotoUrl` (Optional) to the `Student` table, and a `role` enum (`ADMIN`, `SUPER_ADMIN`) to the `Admin` table.
> A default `SUPER_ADMIN` will be seeded (Email: `admin@mghal.com` / Password: `securepassword`).

## Proposed Changes

---

### Database Schema

#### [MODIFY] [schema.prisma](file:///f:/manar-schedule-system/prisma/schema.prisma)
- Add `idNumber String @unique` and `idPhotoUrl String?` to the `Student` model.
- Define a new enum `AdminRole`:
  ```prisma
  enum AdminRole {
    ADMIN
    SUPER_ADMIN
  }
  ```
- Add a `role AdminRole @default(ADMIN)` field to the `Admin` model.

---

### Backend API & Authentication

#### [MODIFY] [server.js](file:///f:/manar-schedule-system/src/server.js)
- Update login endpoint (`POST /api/auth/login`): Include the database `role` from the logged-in `Admin` in the signed JWT token.
- Implement registration endpoint `POST /api/auth/register`:
  - Accepts: `fullName`, `email`, `password`, `idNumber`, `idPhotoUrl`, `departmentId`, `majorId`, `levelId`, `groupId`.
  - Hashes the password using `bcryptjs` (salt rounds: 10).
  - Creates the student record in the database.
  - Returns a JWT token valid for 30 days (`30d`).
- Implement impersonate endpoint `POST /api/auth/impersonate`:
  - Protect via token verification: only users with role `SUPER_ADMIN` are authorized.
  - Accepts `studentId`.
  - Signs a new JWT token acting as that student (with their `id`, `name`, `role: 'STUDENT'`, and `groupId`).
  - Returns the signed token and student user details.
- Implement helper query endpoints:
  - `GET /api/departments` - Returns all departments.
  - `GET /api/majors` - Returns all majors (allows filtering by `departmentId`).
  - `GET /api/levels` - Returns all academic levels.
  - `GET /api/students` - Returns all registered students with their major, level, and group details (protected, admin-only).

#### [MODIFY] [seed.js](file:///f:/manar-schedule-system/prisma/seed.js)
- Update seed file to upsert the default `SUPER_ADMIN`:
  - Name: `Chief Architect`
  - Email: `admin@mghal.com`
  - Password: `securepassword` (hashed)
  - Role: `SUPER_ADMIN`
- Update existing `admin@manar.edu` record to have role `ADMIN`.

---

### Frontend Components

#### [NEW] [Register.jsx](file:///f:/manar-schedule-system/frontend/src/Register.jsx)
- Build a multi-step or dynamic cascading dropdown form using Tailwind CSS & Glassmorphism styling matching the current theme.
- Cascading logic: Select Department -> Fetch Majors -> Select Level -> Fetch Groups.
- Add inputs: Name, Email, Password, ID Number (Required), ID Photo URL (Optional).
- Upon successful registration, automatically save `manar_token` and `manar_user` and redirect to `/student/home`.

#### [MODIFY] [Login.jsx](file:///f:/manar-schedule-system/frontend/src/Login.jsx)
- Add a Link to `/register`: "New Student? Create an Account".

#### [NEW] [Students.jsx](file:///f:/manar-schedule-system/frontend/src/Students.jsx)
- Build a student directory page showing all registered students, their ID Number, department, major, and level.
- For each record, show a button: "🔑 Impersonate Student".
- When clicked, calls `POST /api/auth/impersonate`, saves the new token/user details to local storage, and routes to `/student/home`.

#### [MODIFY] [App.jsx](file:///f:/manar-schedule-system/frontend/src/App.jsx)
- Register `/register` route for non-authenticated layout.
- Register `/admin/students` route for the student list.
- Add the `Students Directory` link to the admin sidebar.

## Verification Plan

### Automated Tests
- N/A (verify via manual/api testing).

### Manual Verification
1. Verify database changes are active: check Supabase/PostgreSQL schema.
2. Seed db using `node prisma/seed.js` or `npx prisma db seed`.
3. Try logging in with the newly seeded super admin `admin@mghal.com`.
4. Go to `/register` and create a student. Verify cascade dropdowns work.
5. Go to Admin Panel -> Students Directory, verify listing works.
6. Click "Impersonate Student" on the student created. Verify redirection to `/student/home` and correct layout and schedules.
