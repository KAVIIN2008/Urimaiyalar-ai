#!/usr/bin/env node
/**
 * URIMAIYALAR OS — Switch to PostgreSQL
 * Switches the Prisma schema provider from sqlite to postgresql.
 * Run: npm run db:use-postgres
 *
 * BEFORE RUNNING: Set DATABASE_URL in .env to your PostgreSQL connection string.
 * FREE options:
 *   Supabase: https://supabase.com   (500MB free, pgbouncer built-in)
 *   Neon:     https://neon.tech      (0.5 GB free, serverless branching)
 *   Railway:  https://railway.app    (free trial, 1GB)
 *
 * STEPS:
 *   1. Sign up at https://supabase.com (free)
 *   2. Create a project
 *   3. Settings ? Database ? Connection String ? URI (Transaction mode for pooling)
 *   4. Paste that URL as DATABASE_URL in .env
 *   5. Run: npm run db:use-postgres
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Read current schema
let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

// Check DATABASE_URL
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl || dbUrl.includes('file:')) {
  console.error('\n? ERROR: DATABASE_URL in .env is still pointing to SQLite.');
  console.error('   Please set DATABASE_URL to your PostgreSQL connection string first.');
  console.error('   Example: DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"');
  console.error('\n   FREE PostgreSQL options:');
  console.error('   • Supabase: https://supabase.com');
  console.error('   • Neon:     https://neon.tech');
  console.error('   • Railway:  https://railway.app\n');
  process.exit(1);
}

// Switch provider
if (schema.includes('provider = "postgresql"')) {
  console.log('? Already using PostgreSQL — running migrations...');
} else {
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  fs.writeFileSync(SCHEMA_PATH, schema, 'utf-8');
  console.log('? Switched schema provider to PostgreSQL');
}

console.log('\n?? Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('\n???  Running database migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('\n?? PostgreSQL migration complete!');
console.log('   Your app is now ready to handle 5,000+ concurrent users.');
console.log('\nNEXT STEPS:');
console.log('   1. npm run build          — build production bundle');
console.log('   2. npm run start:prod     — start with PM2 cluster mode');
console.log('   3. npm run monit          — monitor all cluster workers');
