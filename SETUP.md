# Setup Guide (From Fresh Clone to Running App)

This guide assumes you just cloned the repository and want to run backend + frontend locally with default Soybean settings.

---

## 0) Prerequisites

- Node.js `>= 18` (recommended LTS: Node 20 or 22)
- `pnpm`
- Docker Desktop (or Docker Engine + Docker Compose)
- Git

Check quickly:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

---

## 1) Clone Repository

```bash
git clone <your-repo-url>
cd soybean-nestjs-template
```

---

## 2) Start Databases (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

Default ports/services:

- PostgreSQL: `localhost:25432`
- Redis: `localhost:26379`

---

## 3) Backend Setup

```bash
cd backend
pnpm install
```

### 3.1 Backend `.env`

Use `backend/.env` (default values below are valid for local Docker setup):

```dotenv
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
DIRECT_DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
```

### 3.2 Backend env fields (what they mean)

| Field                     | Meaning                      | Default / Recommended                          |
| ------------------------- | ---------------------------- | ---------------------------------------------- |
| `APP_PORT`                | Backend HTTP port            | `9528`                                         |
| `DATABASE_URL`            | Prisma DB connection         | `postgresql://soybean:...@localhost:25432/...` |
| `DIRECT_DATABASE_URL`     | Direct DB URL for migrations | same as above                                  |
| `REDIS_HOST`              | Redis host                   | `localhost`                                    |
| `REDIS_PORT`              | Redis port                   | `26379`                                        |
| `REDIS_PASSWORD`          | Redis password               | `123456`                                       |
| `REDIS_DB`                | Redis DB index               | `1`                                            |
| `JWT_SECRET`              | Access token signing secret  | default from project                           |
| `JWT_EXPIRE_IN`           | Access token TTL (seconds)   | `7200`                                         |
| `REFRESH_TOKEN_SECRET`    | Refresh token signing secret | default from project                           |
| `REFRESH_TOKEN_EXPIRE_IN` | Refresh token TTL (seconds)  | `43200`                                        |
| `DOC_SWAGGER_ENABLE`      | Swagger enable flag          | `true`                                         |
| `DOC_SWAGGER_PATH`        | Swagger path                 | `api-docs`                                     |

If you are not customizing infrastructure, you can keep Soybean defaults as-is.

### 3.3 Prisma generate / migrate / seed

```bash
pnpm prisma:generate
npx prisma migrate deploy
npx prisma db seed
```

If `migrate deploy` returns `P3005 (database schema is not empty)`, it means DB may already be initialized by Docker SQL scripts. In that case, continue with:

```bash
npx prisma db seed
```

### 3.4 Start backend

```bash
pnpm start:dev
```

Backend URLs:

- API base: `http://localhost:9528/v1`
- Swagger: `http://localhost:9528/api-docs`

---

## 4) Frontend Setup

Open a new terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend dev URL is usually `http://localhost:9527` (or next free port shown by Vite).

### 4.1 Frontend env fields

`frontend/.env` and mode-specific `.env.test` are used.

Important fields:

| Field                                 | Meaning                     | Default                    |
| ------------------------------------- | --------------------------- | -------------------------- |
| `VITE_HTTP_PROXY`                     | Use Vite proxy in dev       | `Y`                        |
| `VITE_SERVICE_BASE_URL` (`.env.test`) | Backend API base            | `http://localhost:9528/v1` |
| `VITE_SERVICE_SUCCESS_CODE`           | Backend success code        | `200`                      |
| `VITE_SERVICE_EXPIRED_TOKEN_CODES`    | Token refresh trigger codes | `401`                      |

If you keep backend on `9528`, no change needed.

---

## 5) First Login

Use seeded account:

- Username: `Soybean`
- Password: `123456`

> Note: `soybean` (lowercase) will fail; username is case-sensitive.

---

## 6) VS Code PostgreSQL Extension Setup

If you install a PostgreSQL extension (e.g. PostgreSQL by Chris Kolkman or SQLTools + PostgreSQL driver), it will ask for connection fields.

Fill with project defaults:

- Hostname / Server: `localhost`
- Port: `25432`
- Database: `soybean-admin-nest-backend`
- Username / User: `soybean`
- Password: `soybean@123.`
- SSL: `Disable` / `false`

Optional:

- Connection name: `soybean-local`

After connecting, you should see tables like `sys_user`, `sys_role`, `sys_menu`, `casbin_rule`.

---

## 7) Verify Everything Works

### 7.1 Quick backend check

Open in browser:

- `http://localhost:9528/v1/menu/getConstantRoutes`

You should get JSON with `code: 200`.

### 7.2 API auth check (optional)

Login endpoint:

`POST http://localhost:9528/v1/auth/login`

Body:

```json
{
  "identifier": "Soybean",
  "password": "123456"
}
```

Then call:

`GET http://localhost:9528/v1/auth/getUserInfo`

with header:

`Authorization: Bearer <token>`

### 7.3 Frontend pages to verify

- Login page
- Manage → Role
- Manage → User
- Access Key
- Log → Login / Operation

---

## 8) How to Add a New Handler (Example: `/v1/test`)

Use this as a minimal backend API flow reference.

### Step 1: Create a controller

Create `backend/apps/base-system/src/api/test/rest/test.controller.ts`.

Key points:

- Add `@Controller('test')` so route becomes `/v1/test` (because global prefix is `/v1`)
- Add `@Get()` for list query
- Use `@Public()` if you want no token required
- Reuse existing service (`UserService`) instead of querying DB directly

### Step 2: Export controller from rest index

Create `backend/apps/base-system/src/api/test/rest/index.ts`:

- Export `Controllers = [TestController]`

### Step 3: Register controller in API module

Update `backend/apps/base-system/src/api/api.module.ts`:

- Import `Controllers as TestControllers` from `./test/rest`
- Spread `...TestControllers` into `AllControllers`

### Step 4: Start/restart backend

```bash
cd backend
pnpm start:dev
```

### Step 5: Verify endpoint

Call:

- `GET http://localhost:9528/v1/test`

Expected:

- `code: 200`
- `data.records` contains seeded users

If your endpoint should be protected, remove `@Public()` and add the same authz decorators used by other controllers.

---

## 9) How to Add a Frontend Route (Example: `/about`)

This project uses `elegant-router` (file-based route generation).

### Step 1: Create the page file

Create:

- `frontend/src/views/about/index.vue`

Once this file exists, `elegant-router` can generate route metadata for `/about`.

### Step 2: Add route i18n title

Update route labels:

- `frontend/src/locales/langs/en-us.ts` → add `route.about`
- `frontend/src/locales/langs/zh-cn.ts` → add `route.about`

### Step 3: Generate route artifacts

From repo root:

```bash
pnpm -C frontend run gen-route
```

This updates generated files under:

- `frontend/src/router/elegant/imports.ts`
- `frontend/src/router/elegant/routes.ts`
- `frontend/src/router/elegant/transform.ts`

### Step 4: Type-check and run

```bash
pnpm -C frontend run typecheck
pnpm -C frontend run dev
```

These scripts come from `frontend/package.json`:

- `gen-route`: regenerate route map
- `typecheck`: `vue-tsc --noEmit --skipLibCheck`
- `dev`: run Vite in test mode

### Step 5: Dynamic route mode note

Current default is `VITE_AUTH_ROUTE_MODE=dynamic` (`frontend/.env`).

That means authenticated menu routes come from backend APIs (`/menu/getUserRoutes`).
So if you want `/about` to appear in sidebar menus for logged-in users, also add corresponding menu/route data in backend.

---

## 10) Troubleshooting

### A) `Cannot connect to database`

- Check containers: `docker compose ps`
- Ensure `backend/.env` points to `localhost:25432`

### B) `Redis connection refused`

- Check Redis container running
- Ensure `REDIS_PORT=26379` and password `123456`

### C) `Cannot GET /v1/...` (404)

Usually path mismatch between frontend and backend route contract.

Examples of valid backend paths in this repo:

- `/v1/role/page`
- `/v1/user/page`
- `/v1/menu/getConstantRoutes`
- `/v1/login-log/page`
- `/v1/operation-log/page`
- `/v1/access-key/page`

### D) `Forbidden resource` (403)

- Token is present but permission denied by authz/casbin
- Re-login and retry
- Confirm seeded role and policies exist

### E) Frontend starts on another port

If `9527` is occupied, Vite auto-selects next free port (e.g. `9529`). Use the port shown in terminal.

---

## 11) Full Docker (Optional)

Run all services via Docker:

```bash
docker compose up -d
```

This starts DB + Redis + backend + frontend (with init steps).
