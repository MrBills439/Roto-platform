# Rota Backend Starter

Production-grade Node.js + TypeScript backend starter for a rota platform.

## Tech Stack
- Node.js + TypeScript
- Express
- PostgreSQL + Prisma ORM
- Zod validation
- bcrypt + jsonwebtoken
- dotenv, helmet, cors
- pino logging

## Setup
1. Copy env file and set values:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Migrations
- Create and apply a migration:
  ```bash
  npx prisma migrate dev --name init
  ```
- Generate Prisma client:
  ```bash
  npx prisma generate
  ```

## Run
- Dev:
  ```bash
  npm run dev
  ```
- Build:
  ```bash
  npm run build
  ```
- Start:
  ```bash
  npm start
  ```
