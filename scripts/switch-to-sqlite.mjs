#!/usr/bin/env node
/** Switches back to SQLite for local development. Run: npm run db:use-sqlite */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
fs.writeFileSync(SCHEMA_PATH, schema, 'utf-8');
console.log('Switched to SQLite for local dev');
console.log('Make sure DATABASE_URL=file:./dev.db in .env');
execSync('npx prisma generate', { stdio: 'inherit' });
