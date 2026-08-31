# asset-management-system
this is my main project
Problem Statement - 
Modern enterprises manage thousands of physical assets (laptops, monitors, mobile devices) and digital subscriptions (SaaS licenses, cloud credentials) distributed across hybrid and remote teams.
Companies lose millions annually due to:
Ghost Assets: Paying for SaaS licenses assigned to offboarded employees.
Audit Failures: Inability to track asset movement, warranty expirations, and compliance history.
Security & Access Risks: Unrestricted access where low-level staff can view or modify sensitive infrastructure assignments.
This platform solves these problems by providing real-time tracking, automated audit logs, role-based access control (RBAC), and license lifecycle management.

System Architecture & Tech Stack
Frontend: React (Vite), Redux Toolkit / React Query, Tailwind CSS, Lucide React (Icons).
Backend: Node.js, Express.js.
Database: MongoDB (with Mongoose ORM).
Caching & Queues: Redis, BullMQ.
Storage & Auth: AWS S3 (for receipts/contracts), JWT + HTTP-Only Cookies.


# AssetTrack — Enterprise Asset Management & Audit Platform

A simplified, fully working version of the platform described in your blueprint document.
Built with the MERN stack (MongoDB, Express, React, Node.js).

This README explains **how to run it**, **what each part does**, and **why** it's built this way —
read it alongside the code.

---

## 1. Folder Structure

```
asset-management-platform/
├── backend/
│   ├── config/
│   │   └── db.js                # Connects to MongoDB Atlas
│   ├── models/
│   │   ├── User.js               # User schema (roles, department, password hash)
│   │   ├── Asset.js              # Asset schema (hardware/software)
│   │   └── AuditLog.js           # Immutable action log
│   ├── middleware/
│   │   ├── authMiddleware.js     # Checks the login token (protect)
│   │   ├── roleMiddleware.js     # Checks the user's role (allowRoles)
│   │   └── uploadMiddleware.js   # Handles file uploads (multer)
│   ├── controllers/
│   │   ├── authController.js     # Register / Login / Me
│   │   ├── assetController.js    # Create / list / assign / retire assets
│   │   ├── auditController.js    # Fetch audit logs
│   │   └── userController.js     # List users (for the "assign" dropdown)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── auditRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/                  # Uploaded invoice files land here
│   ├── server.js                 # App entry point
│   ├── package.json
│   └── .env.example              # Copy to .env and fill in your secrets
│
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Pre-configured API client (attaches login token)
    │   ├── context/AuthContext.jsx # Global "who is logged in" state
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx # Blocks pages from users who aren't logged in / wrong role
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AssetDirectory.jsx # Core CRUD + assign/retire page
    │   │   ├── MyAssets.jsx       # Employee self-service view
    │   │   └── AuditLogs.jsx      # Compliance trail (Admin/Auditor only)
    │   ├── App.jsx                # All routes are wired up here
    │   └── main.jsx                # React entry point
    ├── index.html
    └── package.json
```

**Why this structure?** It follows the **MVC-ish pattern** that almost every Express backend
uses: `models` (data shape) → `controllers` (logic) → `routes` (URLs), with `middleware` as
reusable checks that run before a controller. Interviewers will recognize this instantly —
it's the industry-standard way to organize a Node API.

---

## 2. How to Run It Locally

### Step 1 — Get a free MongoDB database
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a free **M0 cluster**.
3. Under "Database Access", create a database user (username + password).
4. Under "Network Access", allow access from anywhere (`0.0.0.0/0`) — fine for development.
5. Click "Connect" → "Drivers" and copy your connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

### Step 2 — Set up the backend
```bash
cd backend
npm install
cp .env.example .env
```
Now open `.env` and paste in your MongoDB connection string (add `/asset-management` at
the end of it so it creates a database with that name), and set any random string as `JWT_SECRET`.

```bash
npm run dev
```
You should see `Server running on http://localhost:5000` and `MongoDB Connected: ...`.

### Step 3 — Set up the frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

### Step 4 — Try it out
1. Go to `/register` and create an account. **Pick "Super Admin"** as the role so you can see
   every feature (in a real company, only an existing admin could create other admins — see
   the "Known Simplifications" section below).
2. Add a couple of assets from the Asset Directory page.
3. Click "Assign" on one, paste in a user's ID to assign it to them.
4. Log out, register a second account as "Employee", and check the "My Assets" page.
5. Log back in as Super Admin and check "Audit Logs" — you'll see every action recorded.

---

## 3. Why the App Is Built This Way (Key Decisions Explained)

**JWT Authentication (not sessions).**
When you log in, the backend signs a token (a scrambled proof of "this is user X") and sends
it back. The frontend saves it and attaches it to every future request. The server doesn't need
to remember anything about who's logged in — it just verifies the token's signature. This is
why JWT-based auth scales well and is the standard for REST APIs.

**Role-Based Access Control (RBAC) enforced in TWO places.**
- **Backend** (`roleMiddleware.js`): the real security boundary. Even if someone hacks the UI,
  the API itself refuses the request.
- **Frontend** (`ProtectedRoute.jsx`, conditional buttons): just for a good user experience —
  hiding buttons/pages a user isn't allowed to use, so they don't hit dead ends.
This "defense in depth" (checking on both sides) is a real interview talking point.

**Password hashing with bcrypt.**
We never store a real password anywhere. `bcrypt.hash()` scrambles it one-way; `bcrypt.compare()`
checks a login attempt against that scramble without ever un-scrambling it.

**Audit Logs are write-only (immutable).**
The `AuditLog` schema disables `updatedAt` on purpose. A compliance log that can be silently
edited after the fact is worthless — this is a real practice used in fintech/enterprise systems.

**MongoDB references instead of duplicating data.**
An `Asset` stores `assignedTo: <User ID>` rather than copying the employee's name into every
asset record. If the employee's name changes, we don't have to update every asset — we just
look it up (`.populate()`) when needed.

---

## 4. Known Simplifications (be upfront about these in interviews — it shows maturity)
Your blueprint document describes a bigger system than what's built here, on purpose —
you asked to keep it simple. Here's exactly what was simplified and why:

| Blueprint feature | What we built instead | Why |
|---|---|---|
| Cloudinary/Supabase file storage | Local disk storage via Multer | No external account/API keys needed to run the project immediately. Swapping this back in only requires changing `uploadMiddleware.js`. |
| Access token (memory) + Refresh token (HTTP-only cookie) | Single JWT stored in `localStorage` | Much simpler to reason about as a beginner. **Trade-off to mention in interviews:** tokens in localStorage are more exposed to XSS attacks than httpOnly cookies — a good "what I'd improve" answer. |
| Upstash Redis + BullMQ background jobs (warranty alerts, audit survey emails) | Not implemented | Requires a queue/worker setup beyond a first version. This is a great **"Phase 2" feature** to add once the core app works — mention it as a roadmap item. |
| Resend/Nodemailer email notifications | Not implemented | Same reasoning — a clean extension once you're comfortable with the core app. |
| SaaS License Seat Manager module | Not implemented | Kept scope to Hardware/Software asset tracking + audit trail, the "spine" of the system. |
| Registration lets you self-select a role | Same, but flagged here | In production, only an existing Super Admin should be able to create other Super Admins. Doing it at signup is only for making the project easy to demo. |

**Suggested talking point for interviews:** "I designed it so these pieces (Cloudinary, Redis
queues, email) can be dropped in later without changing the rest of the app, because the
upload logic and business logic are already separated into their own files."

## 5. Suggested Next Steps (to make your resume project even stronger)
1. Add the SaaS License Seat Manager module (a new `License` model + CRUD, same pattern as Assets).
2. Add CSV export for the Audit Logs page (`json2csv` on the backend).
3. Swap local file storage for Cloudinary once you're comfortable — it's literally a resume keyword.
4. Deploy it for free: backend → Render/Railway, frontend → Vercel/Netlify, database → MongoDB Atlas.
5. Add pagination to the Asset Directory table once you have 20+ assets.

Good luck with the internship search — this project, explained well, demonstrates real
full-stack skills: auth, RBAC, REST API design, file handling, and audit-trail thinking.
