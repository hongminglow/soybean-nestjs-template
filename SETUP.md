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

Recommended (single command):

```bash
pnpm db:setup
```

`db:setup` in `backend/package.json` is:

```bash
node ./scripts/db-setup-safe.cjs
```

What `db:setup` now does:

- runs `pnpm prisma:generate`
- runs `pnpm db:deploy`
- if deploy fails with `P3005 (schema is not empty)`, it auto-baselines pending migrations with `prisma migrate resolve --applied ...`
- re-checks migration status
- runs idempotent migration repair SQL files (those using `IF NOT EXISTS`) to self-heal missing tables on existing local DBs
- runs `pnpm db:seed`
- if deploy fails for other reasons, it stops and returns error

Equivalent manual commands:

```bash
pnpm prisma:generate
pnpm db:deploy
pnpm db:seed
```

What this ensures for a fresh clone:

- applies all committed Prisma migrations under `backend/prisma/migrations`,
- then applies seed data under `backend/prisma/seeds` (including menu/role mappings such as `manage_sms` and `manage_config`).

If `pnpm db:deploy` returns `P3005 (database schema is not empty)`, it means DB may already be initialized by Docker SQL scripts. In that case, continue with:

```bash
pnpm db:seed
```

Recommended fallback flow for existing local DBs:

```bash
cd backend
pnpm prisma:generate
pnpm db:deploy   # if P3005, continue
pnpm db:seed
```

### 3.3.1 After changing `schema.prisma` (keep current records, no reset)

Use this flow when you change columns/tables but want to keep existing data.

#### Step 0) If this DB existed before Prisma migration history, baseline it once

If `npx prisma migrate status` shows many old migrations as "not yet applied" on a DB that already has tables/data, mark them as applied first (no data drop):

```bash
cd backend
npx prisma migrate resolve --applied 0_init_migration
npx prisma migrate resolve --applied 0_migration
npx prisma migrate resolve --applied 1_migration
npx prisma migrate resolve --applied 20240902161339_migration
```

Then re-check:

```bash
npx prisma migrate status
```

Do this baseline step only once per existing local database.

#### Step 1) Confirm database is reachable

```bash
cd backend
pnpm db:status
```

#### Step 2) Create a named migration from your schema change

```bash
cd backend
npx prisma migrate dev --name <describe_change>
```

Example:

```bash
npx prisma migrate dev --name rename_sys_user_id_to_user_id
```

This creates a new folder under `backend/prisma/migrations/...` and updates Prisma Client.

#### Step 3) If Prisma asks for `migrate reset`, do NOT reset production-like data

If your local DB was initialized by SQL scripts or drifted from Prisma migration history, `migrate dev` may request reset.

To keep records, use this safe path instead:

1. Create SQL manually for only the needed change (example: `ALTER TABLE ... RENAME COLUMN ...`).
2. Run that SQL against current DB:

```bash
cd backend
npx prisma db execute --file <path-to-sql-file>
```

3. Regenerate Prisma Client:

```bash
pnpm prisma:generate
```

4. Create a migration file for teammates (so cloned repos can apply the same change):

```bash
npx prisma migrate dev --name <describe_change> --create-only
```

5. Commit all of these together:

- `backend/prisma/schema.prisma`
- new folder in `backend/prisma/migrations/`
- any SQL file you used for manual execute

#### Step 4) Restart only backend process

- Local dev: stop/start `pnpm start:dev`
- Docker backend: `docker compose restart backend`

You do **not** need to restart PostgreSQL/Redis for schema-only changes.

#### Step 5) Team member flow after pulling

```bash
cd backend
pnpm install
pnpm db:setup
```

Then restart backend.

### 3.4 Start backend

```bash
pnpm start:dev
```

Backend URLs:

- API base: `http://localhost:9528/v1`
- Swagger: `http://localhost:9528/api-docs`

### 3.5 Example: create a new table with Prisma (`sys_test`)

This repo now includes a mock table model in Prisma schema: `SysTest` (`@@map("sys_test")`).

File references:

- Prisma model: `backend/prisma/schema.prisma`
- SQL fallback for existing DBs: `deploy/postgres/09_sys_test.sql`

#### Step 1) Add model in Prisma schema

Example:

```prisma
model SysTest {
  id          String    @id @default(cuid())
  testCode    String    @unique @map("test_code")
  testName    String    @map("test_name")
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  meta        Json?
  createdAt   DateTime  @default(now()) @map("created_at")
  createdBy   String    @map("created_by")
  updatedAt   DateTime? @updatedAt @map("updated_at")
  updatedBy   String?   @map("updated_by")

  @@map("sys_test")
}
```

#### Step 2) Apply DB change

Option A (clean Prisma migration flow, recommended for new/clean dev DB):

```bash
cd backend
npx prisma migrate dev --name add_sys_test_table
```

Option B (this project's common local setup if drift exists due preloaded SQL):

```bash
cd backend
npx prisma db execute --file ../deploy/postgres/09_sys_test.sql
pnpm prisma:generate
```

#### Step 3) Reflect changes in app runtime

- If backend runs via local dev command (`pnpm start:dev`): restart backend process once.
- If backend runs in Docker: restart only backend container:

```bash
docker compose restart backend
```

- PostgreSQL/Redis container restart is NOT required for schema-only changes.

#### Step 4) Verify table exists

```bash
docker compose exec -T postgres psql -U soybean -d soybean-admin-nest-backend -c '\d "sys_test"'
```

You can also run `pnpm prisma:studio` in `backend` and check `sys_test` visually.

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

### 4.2 Git hooks bootstrap (run once per clone)

This repository uses `simple-git-hooks` from the frontend package. Run this once after cloning (and after pulling hook changes):

```bash
pnpm -C frontend run prepare
```

Why: hooks are written into `.git/hooks` and are not versioned by Git. If hooks are stale, commit may fail with errors like:

- `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`
- `No package.json found in repo root`

Safe refresh command:

```bash
pnpm -C frontend run prepare
```

### 4.3 Formatting standard (Prettier + format on save)

This repo now includes workspace VS Code settings to auto-format with Prettier on save:

- `.vscode/settings.json` (workspace-level)
- `.vscode/extensions.json` (recommended extensions)

Please install recommended extensions when prompted (especially `esbenp.prettier-vscode`).

Manual format commands:

```bash
# frontend
pnpm -C frontend run format
pnpm -C frontend run format:check

# backend
pnpm -C backend run format
pnpm -C backend run format:check
```

Notes:

- `formatOnSave` uses Prettier for common file types (ts/js/vue/json/md/yaml/css/scss).
- `prettier.requireConfig=true` is enabled to avoid accidental formatting from global defaults.

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

### Step 6: Dynamic RBAC setup for new route (example: `manage_sms-config`)

In this project, adding frontend route files alone is **not enough** for sidebar visibility when route mode is dynamic.

You must complete all 3 mappings below:

1. **Frontend route exists**

- Example route name: `manage_sms-config`
- Example path: `/manage/sms-config`
- Example component key: `view.manage_sms-config`

2. **Backend menu exists (`sys_menu`)**

- Add menu record with the same `routeName`, `routePath`, and `component`
- Parent menu should be `manage` (`pid` of manage menu)

3. **Role-menu mapping exists (`sys_role_menu`)**

- Assign that menu ID to target role(s), for example `ROLE_SUPER`
- Only roles with this mapping will see the menu from `/authorization/getUserRoutes`

Then assign user to role (`sys_user_role`), log out, and log in again to refresh role cache.

You can do assignment from UI:

- Manage → Role → Menu Auth (assign route/menu to role)
- Manage → Role → User assignment (bind user to role)

Or by API:

- `POST /v1/authorization/assignRoutes`
- `POST /v1/authorization/assignUsers`

For seeded environments, this repository now includes `manage_sms-config` menu seed and default mapping to `ROLE_SUPER`.

Apply/update seed data:

```bash
cd backend
npx prisma db seed
```

---

## 10) Troubleshooting

### A0) `prisma migrate dev` says reset is required, but I must keep data

- Do **not** run `prisma migrate reset` if you need current records.
- Run `npx prisma migrate status`; if old migrations show as unapplied on an existing DB, baseline with `npx prisma migrate resolve --applied <migration_name>` for each historical migration.
- Apply only the intended SQL change with `prisma db execute`.
- Run `pnpm prisma:generate`.
- Generate migration metadata with `prisma migrate dev --create-only --name <change_name>` and commit it.
- For shared/dev/staging/prod rollout, use `prisma migrate deploy` on environments that should apply committed migrations.

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

### F) Git commit fails with `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`

This usually means `.git/hooks` still has old scripts that run `pnpm` from repo root.

Fix:

```bash
pnpm -C frontend run prepare
```

If you need to commit urgently and skip hooks once:

```bash
SKIP_SIMPLE_GIT_HOOKS=1 git commit -m "your message"
```

---

## 11) Full Docker (Optional)

Run all services via Docker:

```bash
docker compose up -d
```

This starts DB + Redis + backend + frontend (with init steps).
