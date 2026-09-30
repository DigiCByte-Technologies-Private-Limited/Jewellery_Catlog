# Jewellery Multi-Panel Enterprise Application

A production-ready monorepo workspace for a multi-panel enterprise system featuring a centralized NestJS backend, PostgreSQL database, Admin and Customer web applications (Vite + React + TypeScript + Tailwind CSS), and Admin and Customer mobile applications (Flutter) powered by a shared API client library.

---

## Workspace Structure

```
jewellery/
├── backend/                  → Central NestJS API (Single Source of Truth, MVC + DDD)
├── admin-web/                → Admin Web Portal (Vite + React + TS + Tailwind)
├── customer-web/             → Customer Storefront (Vite + React + TS + Tailwind)
├── admin-mobile/             → Admin Flutter Mobile App
├── customer-mobile/          → Customer Flutter Mobile App
├── packages/
│   └── shared_api_client/    → Shared Flutter/Dart Package (Dio, Retrofit, Models, Auth)
├── docker-compose.yml        → PostgreSQL 16 local database service
└── README.md                 → Architecture and operational guide
```

---

## 1. High-Level Architecture

| Application / Package | Technology Stack | Role | Port / Target |
| :--- | :--- | :--- | :--- |
| **Backend API** | NestJS 11, TypeORM, PostgreSQL, Passport JWT, Swagger | Unified REST API & Auth | `http://localhost:3000/api/v1` |
| **Admin Web** | Vite, React 19, TypeScript, Tailwind CSS v4, Zustand | Backoffice Admin Dashboard | `http://localhost:5173` |
| **Customer Web** | Vite, React 19, TypeScript, Tailwind CSS v4, Zustand | Public Customer Portal | `http://localhost:5174` |
| **Admin Mobile** | Flutter 3, Dart 3 | Operational Admin App | iOS / Android / Desktop |
| **Customer Mobile** | Flutter 3, Dart 3 | Customer Mobile App | iOS / Android |
| **shared_api_client**| Flutter Package, Dio, Retrofit, JsonSerializable | Common API client & models | Local path dependency |

---

## 2. Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: v20+ or v22+ (`node -v`)
- **NPM**: v10+ (`npm -v`)
- **Flutter SDK**: v3.24+ or v3.44+ (`flutter --version`)
- **Docker & Docker Compose**: For running PostgreSQL (`docker compose version`)

---

## 3. Getting Started & Running Locally

### Step 1: Start the PostgreSQL Database
From the monorepo root:
```bash
docker-compose up -d
```
This starts PostgreSQL 16 container `jewellery_postgres` with credentials:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `app_db`
- **User**: `admin`
- **Password**: `admin`

---

### Step 2: Start the Backend API (NestJS)
```bash
cd backend
npm run start:dev
```
- **API Base URL**: `http://localhost:3000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`

#### Database Migrations (TypeORM CLI):
```bash
cd backend
npx typeorm-ts-node-commonjs migration:generate ./src/database/migrations/Init -d src/database/data-source.ts
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
```

---

### Step 3: Start Admin Web (Vite + React)
```bash
cd admin-web
npm run dev
```
Accessible at: `http://localhost:5173` (or the port Vite allocates).

---

### Step 4: Start Customer Web (Vite + React)
```bash
cd customer-web
npm run dev
```
Accessible at: `http://localhost:5174` (or next available port).

---

### Step 5: Shared Flutter Package Maintenance
When adding new endpoints or models to the shared package:
```bash
cd packages/shared_api_client
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

---

### Step 6: Start Mobile Applications (Flutter)

#### Admin Mobile:
```bash
cd admin-mobile
flutter pub get
flutter run
```

#### Customer Mobile:
```bash
cd customer-mobile
flutter pub get
flutter run
```

---

## 4. Architectural Rules & Patterns

### Backend (NestJS — MVC + Domain-Driven Structure)
- **Domain-First Organization**: Every domain resides in `src/modules/<domain>` with its own Controller (C), Service (Model logic), Entity (Model), and DTOs.
- **Security**: Hardened with Helmet, global CORS configured for web and mobile clients, Throttler rate limiting, and global `ValidationPipe` with payload whitelist transformation.
- **RBAC**: Role-based access control via `@Roles()` decorator and `RolesGuard` distinguishing `admin`, `customer`, and `superadmin`.
- **API Versioning & Documentation**: All routes mapped to `/api/v1/...` and fully exposed in Swagger OpenAPI documentation at `/api/docs`.

### Web Applications (Vite + React)
- **Feature/Domain-Driven**: Slices grouped under `src/domains/<domain>` containing domain APIs and views.
- **Centralized HTTP Client**: Shared Axios instance with request/response interceptors and auth token injection in `src/api/httpClient.ts`.
- **Styling**: Tailwind CSS v4 with Vite integration.

### Mobile Applications (Flutter + Shared Package)
- **Zero Endpoint Duplication**: Both `admin-mobile` and `customer-mobile` reference `shared_api_client` via local path dependency (`../packages/shared_api_client`).
- **Encapsulated Network Layer**: Dio client with token interceptor and Flutter Secure Storage are maintained once inside `shared_api_client`.
- **Type-Safe Endpoints**: Retrofit annotations with code-generated Dart clients and JSON serialization.
