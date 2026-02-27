# Backend Syntax Guidance (NestJS + Prisma)

This guide is for backend developers in this project.
It is split into 2 sections:

1. NestJS syntax (API side)
2. Prisma syntax (database/model side)

---

## 1) NestJS Syntax (API Development)

NestJS uses **decorators** like `@Controller`, `@Get`, `@Post`.
A decorator is a TypeScript syntax that adds metadata/behavior to a class or method.

### A. Common decorators you will see

- `@Module({...})`
  - Groups related parts together (controllers, services, imports).
  - Think: “feature container”.

- `@Controller('users')`
  - Marks a class as an API controller.
  - `'users'` becomes the route prefix.
  - Example: all routes in this controller start with `/users`.

- `@Get()`, `@Post()`, `@Put(':id')`, `@Delete(':id')`
  - Map HTTP methods to handler functions.
  - Example: `@Get(':id')` means GET `/users/:id`.

- `@Injectable()`
  - Marks a class as injectable (for Dependency Injection).
  - Usually used for service classes.

- `@Body()`, `@Param()`, `@Query()`, `@Headers()`
  - Read values from request body, path params, query string, headers.

- `@UseGuards(...)`
  - Applies auth/permission guard to route or controller.

- `@UseInterceptors(...)`
  - Adds extra processing around request/response (logging, transform, etc).

### B. Quick structure: open a new API

Typical files:

- `xxx.module.ts`
- `xxx.controller.ts`
- `xxx.service.ts`
- `dto/*.dto.ts`

Simple flow:

1. Add endpoint in controller using `@Get` / `@Post`.
2. Validate input using DTO class (`class-validator` decorators).
3. Put business logic in service.
4. Controller calls service and returns response.

### C. Example: create a simple endpoint

```ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

### D. DTO validation syntax (very common)

```ts
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 50)
  username: string;

  @IsEmail()
  email: string;
}
```

Meaning:

- `@IsString()` => value must be string.
- `@Length(3, 50)` => string length range.
- `@IsEmail()` => must match email format.

### E. Fast mental model for NestJS

- Controller = **route layer**
- Service = **business logic layer**
- Module = **feature wiring layer**
- DTO = **input/output contract**
- Guard = **authorization gate**
- Interceptor = **cross-cutting behavior**

### F. Swagger syntax (API docs)

Swagger decorators help generate API documentation automatically.

Common ones:

- `@ApiTags('Users')`
  - Groups endpoints in Swagger UI.

- `@ApiOperation({ summary: 'Create user' })`
  - Short description for endpoint purpose.

- `@ApiResponse({ status: 201, description: 'Created' })`
  - Documents response status and meaning.

- `@ApiBearerAuth()`
  - Marks route as requiring bearer token in Swagger.

- `@ApiQuery({ name: 'page', required: false, type: Number })`
  - Documents query params.

- `@ApiParam({ name: 'id', type: String })`
  - Documents path params.

- `@ApiBody({ type: CreateUserDto })`
  - Documents request body DTO.

Example:

```ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() dto: CreateUserDto) {
    return { ok: true, dto };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User found' })
  findOne(@Param('id') id: string) {
    return { id };
  }
}
```

---

## 2) Prisma Syntax (Schema & Database)

Prisma schema defines your data model in `schema.prisma`.
Each `model` usually maps to one database table.

### A. Basic model syntax

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String?  @unique
  createdAt DateTime @default(now())

  @@map("sys_user")
}
```

How to read it:

- `User` = Prisma model name (used in code).
- `id String` = field name and type.
- `String?` = optional field (`null` allowed).
- `@@map("sys_user")` = actual database table name.

### B. Important field attributes (`@...`)

- `@id`
  - Primary key of the model.
  - Each model needs one primary key (or composite key with `@@id`).

- `@unique`
  - Field value must be unique across rows.
  - Example: `username`, `email`.

- `@default(...)`
  - Default value when not provided.
  - Common: `@default(now())`, `@default(cuid())`, `@default(false)`.

- `@updatedAt`
  - Auto-updates timestamp when row changes.

- `@map("column_name")`
  - Maps Prisma field name to real DB column name.
  - Example: `createdAt @map("created_at")`.

### C. Model-level attributes (`@@...`)

- `@@map("table_name")`
  - Maps model to existing DB table.

- `@@id([fieldA, fieldB])`
  - Composite primary key (two or more fields together).

- `@@unique([fieldA, fieldB])`
  - Composite unique constraint.

### D. Common Prisma scalar types

- `String`
- `Int`
- `Boolean`
- `DateTime`
- `Json`
- `Float`
- `Decimal`

Optional marker:

- `String?` / `Int?` means nullable field.

### E. Enums in Prisma

```prisma
enum Status {
  ENABLED
  DISABLED
  BANNED
}
```

Then use it in model:

```prisma
status Status
```

### F. Quick relation example

```prisma
model User {
  id    String @id
  posts Post[]
}

model Post {
  id       String @id
  userId   String
  user     User   @relation(fields: [userId], references: [id])
}
```

Meaning:

- One user has many posts (`Post[]`).
- Each post belongs to one user via `userId`.
- `@relation(...)` tells Prisma how FK is linked.

### G. Fast mental model for Prisma

- `model` = table
- field type = column type
- `@id` = primary key
- `@unique` = unique index
- `@default` = default DB value
- `@map` / `@@map` = map Prisma name <-> existing DB naming
- relation fields = foreign key links

---

## 3) New API Checklist (Beginner Flow)

Use this checklist each time you create a new API.

### Step 1: Define API requirement

- What is the route? (example: `POST /users`)
- Input fields?
- Output shape?
- Need auth/role check?

### Step 2: Prepare DTO

- Create request DTO in `dto/*.dto.ts`.
- Add validators (`@IsString`, `@IsEmail`, `@IsOptional`, etc).
- If needed, create response DTO for clean output contract.

### Step 3: Add service logic

- Put business logic in service, not controller.
- Add Prisma query in service (`findMany`, `findUnique`, `create`, `update`, `delete`).
- Handle known errors (not found, duplicate, forbidden).

### Step 4: Add controller route

- Add `@Get` / `@Post` / `@Put` / `@Delete` endpoint.
- Read request data via `@Body`, `@Param`, `@Query`.
- Call service and return result.

### Step 5: Add Swagger docs

- `@ApiTags` on controller.
- `@ApiOperation` + `@ApiResponse` on method.
- `@ApiBody` / `@ApiParam` / `@ApiQuery` based on input type.
- `@ApiBearerAuth` if protected endpoint.

### Step 6: Update Prisma schema (if DB changes needed)

- Add or update `model` in Prisma schema.
- Use correct attributes (`@id`, `@unique`, `@default`, relations).
- Keep naming clean with `@map` / `@@map` if DB naming uses snake_case.

### Step 7: Run migration + generate client

- Run migration command.
- Run Prisma generate.
- Confirm schema and types are up to date.

### Step 8: Test endpoint quickly

- Call API from Swagger UI or Postman.
- Verify success case + one failure case.
- Confirm DB row result if needed.

### Step 9: Security quick-check

- Input validated?
- Protected routes guarded?
- Sensitive fields hidden from response?

### Step 10: Done criteria

- Endpoint works.
- Swagger docs appear correctly.
- Migration applied (if any).
- Code builds with no errors.
