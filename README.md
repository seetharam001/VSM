# 🚗 Vehicle Service Management System (VSM)

A full-stack production-ready web application with separate dashboards for **Customers**, **Mechanics**, and **Administrators**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v6 |
| State | Zustand + TanStack React Query |
| UI | Vanilla CSS Design System (Dark Mode) |
| Charts | Recharts |
| PDF | jsPDF + html2canvas |
| Backend | Node.js + Express.js |
| Database | SQLite (via Sequelize ORM) |
| Auth | JWT (Access + Refresh Tokens) + bcrypt |

---

## 📁 Project Structure

```
VSM/
├── backend/           # Node.js Express REST API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # Express routes
│   │   ├── middlewares/   # Auth, upload, error
│   │   ├── utils/         # JWT, notifications, responses
│   │   ├── config/        # DB, mailer
│   │   └── seeders/       # Sample data
│   └── uploads/           # Uploaded images
└── frontend/          # React + Vite SPA
    └── src/
        ├── api/           # Axios API clients
        ├── components/    # Reusable UI components
        ├── pages/         # Route-level pages
        │   ├── admin/
        │   ├── customer/
        │   ├── mechanic/
        │   └── auth/
        ├── store/         # Zustand state
        └── utils/         # Route guards
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+ and npm

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- Admin: `admin@vsm.com` / `Admin@123`
- Customer: `john@example.com` / `Customer@123`
- Mechanic: `ravi@vsm.com` / `Mechanic@123`
- Mechanic 2: `suresh@vsm.com` / `Mechanic@123`
- 10 sample services

### 3. Start Backend

```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
# Opens on http://localhost:5173
```

---

## 👥 User Roles

### 🧑 Customer
- Register/Login
- Register multiple vehicles
- Book services (multi-step wizard)
- Track booking status
- View invoices + Download PDF
- Submit feedback/complaints
- View service history

### 🔧 Mechanic
- View assigned jobs
- Update booking status (Inspection → Repair → Complete)
- Add repair notes
- View customer/vehicle details

### 👤 Admin
- Dashboard with charts
- Manage customers, mechanics, services
- Approve bookings, assign mechanics
- Generate invoices
- View reports and analytics
- Reply to feedback & complaints

---

## 📡 API Endpoints

| Module | Endpoint | Method |
|---|---|---|
| Auth | `/api/auth/register` | POST |
| Auth | `/api/auth/login` | POST |
| Auth | `/api/auth/refresh` | POST |
| Auth | `/api/auth/forgot-password` | POST |
| Vehicles | `/api/vehicles` | GET, POST |
| Vehicles | `/api/vehicles/:id` | GET, PUT, DELETE |
| Services | `/api/services` | GET, POST |
| Bookings | `/api/bookings` | GET, POST |
| Bookings | `/api/bookings/:id/status` | PATCH |
| Mechanics | `/api/mechanics` | GET, POST |
| Invoices | `/api/invoices` | POST |
| Invoices | `/api/invoices/:id/payment` | PATCH |
| Notifications | `/api/notifications` | GET |
| Admin | `/api/admin/stats` | GET |
| Admin | `/api/admin/reports/*` | GET |

---

## 🔐 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@vsm.com | Admin@123 |
| Customer | john@example.com | Customer@123 |
| Mechanic | ravi@vsm.com | Mechanic@123 |

---

## 📋 Complete Workflow

1. Customer registers → logs in
2. Customer adds vehicle
3. Customer books service (selects vehicle → service → date → problem)
4. Admin approves booking
5. Admin assigns mechanic
6. Mechanic starts inspection → updates status + adds notes
7. Mechanic completes repair → marks Completed
8. Admin generates invoice (with GST)
9. Customer views & downloads PDF invoice
10. Customer pays → booking moves to Service History

---

## 🎨 Features

- ✅ Dark mode premium UI
- ✅ Role-based access control
- ✅ JWT authentication with refresh tokens
- ✅ Multi-step booking wizard
- ✅ Real-time notification bell
- ✅ PDF invoice download (jsPDF)
- ✅ Live invoice preview with GST calculation
- ✅ Responsive sidebar navigation
- ✅ Charts (Line, Bar, Pie) using Recharts
- ✅ Pagination, search, filters
- ✅ File uploads (vehicle images, avatars)
- ✅ Toast notifications
- ✅ Status transition machine
- ✅ 404 & 403 error pages
