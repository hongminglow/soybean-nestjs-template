# Soybean Admin NestJS Template

A full-stack admin template built with **Soybean Admin** (Vue 3) for the frontend and **NestJS** (Fastify) for the backend. This project provides a clean, maintainable architecture for building admin dashboards with role-based access control.

## Tech Stack

### Frontend

- **Vue 3** + TypeScript
- **Vite 6** - Build tool
- **Naive UI** - UI component library
- **Pinia** - State management
- **UnoCSS** - Utility-first CSS
- **Alova / Axios / Ofetch** - HTTP clients (choose one)

### Backend

- **NestJS 11** + Fastify adapter
- **Prisma 6** - ORM for PostgreSQL
- **Redis** - Caching and session management
- **Casbin** - Role-Based Access Control (RBAC)
- **JWT** - Authentication with access/refresh token pair
- **Swagger** - Auto-generated API docs
- **EventEmitter2** - Async event handling

## Architecture

```
backend/
├── apps/
│   └── base-system/           # Main application
│       └── src/
│           ├── api/            # Controllers + DTOs (REST layer)
│           ├── services/       # Business logic (all services)
│           ├── app.module.ts   # Root module
│           └── main.ts         # App entry
├── libs/                       # Shared libraries
│   ├── bootstrap/              # App bootstrap + API endpoint collection
│   ├── config/                 # Configuration (app, redis, security, cors, throttler)
│   ├── constants/              # Shared constants
│   ├── global/                 # Global modules (shared, cache)
│   ├── infra/                  # Infrastructure
│   │   ├── casbin/             # RBAC (Casbin enforcer, guards, decorators)
│   │   ├── guard/              # JWT guard, API key guard
│   │   ├── decorators/         # Custom decorators (@Public, @Log, @ApiResponseDoc)
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Log interceptor
│   │   ├── rest/               # Response helpers, pagination
│   │   └── strategies/         # Passport JWT strategy
│   ├── logger/                 # Winston logger
│   ├── shared/                 # Shared services (Prisma, Redis, IP2Region, OSS)
│   ├── typings/                # TypeScript type definitions
│   └── utils/                  # Utilities
└── prisma/
    ├── schema.prisma           # Database schema
    ├── migrations/             # Migration files
    └── seeds/                  # Seed data

frontend/
├── src/
│   ├── views/                  # Page components
│   ├── router/                 # Route definitions
│   ├── service/                # API service layer
│   ├── store/                  # Pinia stores
│   ├── components/             # Reusable components
│   └── layouts/                # Layout components
└── packages/                   # Monorepo shared packages
```

## Features

- **Authentication**: JWT login with access + refresh tokens
- **Authorization**: Casbin RBAC with domain-based permission control
- **User Management**: CRUD for users with role assignment
- **Role Management**: CRUD for roles with permission/route assignment
- **Domain Management**: Multi-tenant domain management
- **Menu Management**: Dynamic menu/route configuration
- **API Endpoint Management**: Auto-collected API endpoints for permission binding
- **Access Key Management**: API key generation for external integrations
- **Audit Logs**: Login logs and operation logs
- **System Monitoring**: CPU, memory, disk, network, Redis info

## Default Credentials

| Username  | Password | Role        |
| --------- | -------- | ----------- |
| `soybean` | `123456` | Super Admin |

## License

MIT
