# Setup Guide

Step-by-step instructions to get both the backend and frontend running locally.

## Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)
- **Git**

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd soybean-nestjs-template
```

---

## Step 2: Start PostgreSQL & Redis (via Docker)

The easiest way is to use Docker Compose which spins up both databases:

```bash
# Start only Postgres and Redis containers
docker compose up -d postgres redis
```

This starts:

- **PostgreSQL 16** on port `25432` (user: `soybean`, password: `soybean@123.`, database: `soybean-admin-nest-backend`)
- **Redis** on port `26379` (password: `123456`)

> **Alternative**: If you have Postgres and Redis installed locally, update the connection strings in `backend/.env` accordingly.

---

## Step 3: Backend Setup

```bash
cd backend
```

### 3.1 Install Dependencies

```bash
pnpm install
```

### 3.2 Configure Environment

The backend uses a `.env` file at `backend/.env`. The default values work with the Docker setup above:

```dotenv
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
DIRECT_DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
```

The following environment variables can also be set (they have sensible defaults):

| Variable                  | Default                                          | Description                  |
| ------------------------- | ------------------------------------------------ | ---------------------------- |
| `NODE_ENV`                | `development`                                    | Environment mode             |
| `APP_PORT`                | `9528`                                           | Backend server port          |
| `DATABASE_URL`            | _(see .env)_                                     | PostgreSQL connection string |
| `REDIS_HOST`              | `localhost`                                      | Redis host                   |
| `REDIS_PORT`              | `26379`                                          | Redis port                   |
| `REDIS_PASSWORD`          | `123456`                                         | Redis password               |
| `REDIS_DB`                | `1`                                              | Redis database index         |
| `JWT_SECRET`              | `JWT_SECRET-soybean-admin-nest!@#123.`           | JWT signing secret           |
| `JWT_EXPIRE_IN`           | `7200`                                           | Access token TTL (seconds)   |
| `REFRESH_TOKEN_SECRET`    | `REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.` | Refresh token secret         |
| `REFRESH_TOKEN_EXPIRE_IN` | `43200`                                          | Refresh token TTL (seconds)  |
| `CASBIN_MODEL`            | `model.conf`                                     | Casbin RBAC model file       |
| `DOC_SWAGGER_ENABLE`      | `true`                                           | Enable Swagger docs          |
| `DOC_SWAGGER_PATH`        | `api-docs`                                       | Swagger docs URL path        |

### 3.3 Generate Prisma Client

```bash
pnpm prisma:generate
# or: npx prisma generate
```

### 3.4 Run Database Migrations

```bash
npx prisma migrate deploy
```

This creates all required tables in PostgreSQL.

### 3.5 Seed the Database

```bash
npx prisma db seed
```

This populates initial data: default user (`soybean` / `123456`), roles, menus, domains, permissions, and Casbin rules.

### 3.6 Start the Backend

```bash
pnpm start:dev
```

The backend starts at **http://localhost:9528**.
Swagger API docs available at **http://localhost:9528/api-docs**.

---

## Step 4: Frontend Setup

Open a **new terminal**:

```bash
cd frontend
```

### 4.1 Install Dependencies

```bash
pnpm install
```

### 4.2 Configure Backend URL

The frontend proxies API requests to the backend. The config is in `frontend/.env.test`:

```dotenv
VITE_SERVICE_BASE_URL=http://localhost:9528/v1
```

This is the default and should work out of the box.

### 4.3 Start the Frontend

```bash
pnpm dev
```

The frontend starts at **http://localhost:9527** (or another port shown in terminal).

---

## Step 5: Login

Open your browser at the frontend URL and login with:

- **Username**: `soybean`
- **Password**: `123456`

---

## Quick Start (Docker Compose - Full Stack)

To run everything in Docker (PostgreSQL + Redis + Backend + Frontend):

```bash
# From the project root
docker compose up -d
```

This will:

1. Start PostgreSQL and Redis
2. Run database migrations and seeding (`db-init` service)
3. Start the backend on port `9528`
4. Start the frontend on port `9527`

Access the app at **http://localhost:9527**.

---

## Useful Commands

### Backend

| Command                                | Description                 |
| -------------------------------------- | --------------------------- |
| `pnpm start:dev`                       | Start in dev mode (watch)   |
| `pnpm build`                           | Build for production        |
| `pnpm start:prod`                      | Start production build      |
| `pnpm prisma:studio`                   | Open Prisma Studio (DB GUI) |
| `pnpm prisma:generate`                 | Regenerate Prisma client    |
| `npx prisma migrate dev --name <name>` | Create a new migration      |
| `npx prisma migrate deploy`            | Apply migrations            |
| `npx prisma db seed`                   | Run database seed           |

### Frontend

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start dev server             |
| `pnpm build`     | Build for production         |
| `pnpm preview`   | Preview production build     |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint`      | Lint and fix code            |

---

## Troubleshooting

### "Cannot connect to database"

- Ensure PostgreSQL is running: `docker compose ps`
- Check the `DATABASE_URL` in `backend/.env` matches your setup
- Default Docker port is `25432` (not the standard `5432`)

### "Redis connection refused"

- Ensure Redis is running: `docker compose ps`
- Default Docker port is `26379` (not the standard `6379`)
- Default password is `123456`

### "Prisma client not generated"

- Run `npx prisma generate` in the `backend/` directory

### "Missing tables / empty database"

- Run `npx prisma migrate deploy` then `npx prisma db seed`

### Frontend shows login errors

- Make sure the backend is running and accessible at `http://localhost:9528`
- Check the proxy config in `frontend/.env.test`
