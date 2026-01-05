# Project Progress Summary

## Backend (rota-backend)
- Built Node.js + TypeScript + Express backend with Prisma/PostgreSQL, Zod validation, JWT auth, bcrypt, pino logging, helmet/cors.
- Prisma schema includes Users, Houses, Shifts, Assignments (with pending/accepted/rejected/expired status), AuditLog, RotaSend, Availability, ShiftApplication, ShiftTemplate/Items, Notification, enums for roles/gender/shift types, etc.
- Added assignment lifecycle logic with:
  - PENDING -> ACCEPTED/REJECTED/EXPIRED
  - 10-minute expiry for pending assignments
  - Overlap and daily limit checks on assignment creation
- Notifications:
  - Staff gets assignment notifications
  - Managers/Admins only notified on assignment rejection (per latest change)
- Routes implemented:
  - /auth/login
  - /houses CRUD
  - /users CRUD (staff-only filter + list all)
  - /shifts CRUD + open shifts list
  - /assignments CRUD + accept/reject + list
  - /rota/week + /rota/copy-week
  - /availability
  - /templates
  - /shift-applications
  - /notifications
- Added migration for assignment status + notification type SHIFT_EXPIRED.

## Frontend (rota-frontend)
- Next.js 14 App Router + TypeScript + Tailwind.
- Auth flow: login, token stored in localStorage, auth header attached, 401 auto-logout.
- Dashboard with role-based sidebar navigation:
  - Admin/Manager/Team Lead: Rota, Houses, Users, Shifts, Assignments, Notifications
  - Staff: My Shifts, Open Shifts, Notifications, Availability
- Pages implemented:
  - /dashboard/rota: drag & drop assignments, full grid + right sidebar (availability/templates/open shifts)
  - /dashboard/houses: list/create houses + weekly staffing table by house
  - /dashboard/users: create users + filter staff + list all
  - /dashboard/shifts: create shifts with editable start/end times
  - /dashboard/assignments: assign staff to shifts by house; shift dropdown shows shift type + time; unassign by staff name search
  - /dashboard/my-shifts, /dashboard/open-shifts
  - /dashboard/notifications: accept/reject assignments
  - /dashboard/availability: staff availability submission

## Fixes & Adjustments
- Fixed Zod date regex escaping for weekStart query validation.
- Fixed hydration mismatches in staff pages (deterministic date formatting).
- Added assignment listing endpoint for unassign-by-name UI.
- Shift times can be customized regardless of shift type.

## Notes / Pending
- Ensure Prisma migration + generate run after schema changes.
- Rota UI iteration continues; current version is the full grid with right sidebar restored.
