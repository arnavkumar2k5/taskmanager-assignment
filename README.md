# TaskFlow — Task Management Application

A production-ready full-stack task management application built with **Next.js 15**, **PostgreSQL (Neon)**, **JWT authentication**, and **Role-Based Access Control (RBAC)**.

---

## Features

- **Authentication** — Register and login with bcrypt-hashed passwords and JWT tokens
- **Role-Based Access Control** — USER and ADMIN roles with distinct permissions
- **Task CRUD** — Create, read, update, delete tasks with ownership enforcement
- **Pagination & Search** — `?page=`, `?limit=`, `?search=` on all list endpoints
- **Zod Validation** — Schema-level request validation with structured error responses
- **Admin Panel** — Admins can view all users and all tasks
- **Frontend UI** — Dark-themed dashboard with modals, loading states, and toast notifications
- **Docker** — Multi-stage Dockerfile and Docker Compose for local + production
- **Postman Collection** — Pre-built with auto-saving tokens

---

## Tech Stack

| Layer           | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Next.js 15 (App Router)             |
| Language        | TypeScript                          |
| Styling         | Tailwind CSS                        |
| Database        | PostgreSQL (Neon)                   |
| DB Driver       | `pg` (raw SQL, connection pooling)  |
| Authentication  | JWT (`jsonwebtoken`)                |
| Password Hashing| `bcryptjs` (12 salt rounds)         |
| Validation      | `zod`                               |
| Containerization| Docker + Docker Compose             |

---

## Folder Structure

```
src/
├── app/
│   ├── api/v1/
│   │   ├── auth/
│   │   │   ├── register/route.ts   # POST /api/v1/auth/register
│   │   │   └── login/route.ts      # POST /api/v1/auth/login
│   │   ├── tasks/
│   │   │   ├── route.ts            # GET, POST /api/v1/tasks
│   │   │   └── [id]/route.ts       # PUT, DELETE /api/v1/tasks/:id
│   │   └── admin/
│   │       ├── users/route.ts      # GET /api/v1/admin/users
│   │       └── tasks/route.ts      # GET /api/v1/admin/tasks
│   ├── dashboard/page.tsx          # Protected dashboard UI
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── components/                     # Reusable UI components
├── lib/
│   ├── db.ts                       # PostgreSQL connection pool
│   ├── jwt.ts                      # Token generation & verification
│   ├── response.ts                 # API response helpers
│   ├── apiClient.ts                # Frontend fetch wrapper
│   └── auth-context.tsx            # React auth context
├── middleware/
│   └── auth.ts                     # authenticate() / authorize() middleware
├── services/
│   ├── userService.ts              # User database operations
│   └── taskService.ts              # Task database operations
├── types/index.ts                  # Shared TypeScript types
└── validations/index.ts            # Zod schemas
scripts/
├── migrate.sql                     # Database schema + seed
└── migrate.js                      # Migration runner
```

---

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended for cloud)

### 1. Clone and install

```bash
git clone <repo-url>
cd task-management-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run migrations

```bash
npm run db:migrate
```

This creates the `users` and `tasks` tables and seeds an ADMIN account:
- Email: `admin@taskflow.dev`
- Password: `Admin@1234`

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable               | Required | Description                              |
|------------------------|----------|------------------------------------------|
| `DATABASE_URL`         | ✅       | PostgreSQL connection string             |
| `JWT_SECRET`           | ✅       | Secret for signing JWTs (32+ chars)      |
| `JWT_EXPIRES_IN`       | ❌       | Token expiry, default `7d`               |
| `NEXT_PUBLIC_APP_URL`  | ❌       | Public URL, default `http://localhost:3000` |

---

## PostgreSQL Setup (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Set it as `DATABASE_URL` in your `.env.local`
4. Run `npm run db:migrate`

---

## Running Locally

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

---

## Docker Setup

### Build and run with Docker Compose

```bash
# Copy env file
cp .env.example .env

# Build and start (includes local PostgreSQL)
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f app

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Build image only

```bash
docker build -t taskflow-app .
docker run -p 3000:3000 --env-file .env taskflow-app
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint              | Description            | Auth required |
|--------|-----------------------|------------------------|---------------|
| POST   | `/auth/register`      | Register new user      | No            |
| POST   | `/auth/login`         | Login, receive token   | No            |

### Tasks

| Method | Endpoint              | Description               | Auth required |
|--------|-----------------------|---------------------------|---------------|
| GET    | `/tasks`              | Get user's tasks          | USER/ADMIN    |
| POST   | `/tasks`              | Create task               | USER/ADMIN    |
| PUT    | `/tasks/:id`          | Update task (owner only)  | USER/ADMIN    |
| DELETE | `/tasks/:id`          | Delete task (owner/admin) | USER/ADMIN    |

Query params for GET `/tasks`: `?page=1&limit=10&search=keyword`

### Admin

| Method | Endpoint              | Description         | Auth required |
|--------|-----------------------|---------------------|---------------|
| GET    | `/admin/users`        | List all users      | ADMIN only    |
| GET    | `/admin/tasks`        | List all tasks      | ADMIN only    |

### Response format

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## Postman Collection

1. Open Postman
2. Click **Import** → select `TaskFlow-API.postman_collection.json`
3. Set the `base_url` collection variable (default: `http://localhost:3000`)
4. Run **Register User** or **Login User** — the token is automatically saved
5. All other requests use the saved token automatically

---

## Scalability Notes

See [scalability.md](./scalability.md) for detailed notes on the current architecture and future improvement paths.
