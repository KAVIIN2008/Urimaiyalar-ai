import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

// Routers
import productsRouter from './routes/products';
import customersRouter from './routes/customers';
import salesRouter from './routes/sales';
import dashboardRouter from './routes/dashboard';
import whatsappRouter from './routes/whatsapp';
import purchasesRouter from './routes/purchases';
import expensesRouter from './routes/expenses';
import suppliersRouter from './routes/suppliers';
import memoryRouter from './routes/memory';
import authRouter from './routes/auth';
import assistantRouter from './routes/assistant';
import customerPortalRouter from './routes/customerPortal';
import alertsRouter from './routes/alerts';
import schemesRouter from './routes/schemes';
import adminSchemesRouter from './routes/adminSchemes';
import voiceRouter from './routes/voice';
import aiRouter from './routes/ai';
import marketRouter from './routes/market';
import { authenticateToken } from './server/middleware/auth';

export const app = express();
app.use(express.json({ limit: '50mb' }));

// Mount API Routers with JWT / Demo Security
app.use('/api/products', authenticateToken, productsRouter);
app.use('/api/customers', authenticateToken, customersRouter);
app.use('/api/sales', authenticateToken, salesRouter);
app.use('/api/whatsapp', authenticateToken, whatsappRouter);

// The dashboard router handles profile & summary & load-sample & clear
app.use('/api/business', authenticateToken, dashboardRouter); // /api/business/profile
app.use('/api/financial', authenticateToken, dashboardRouter); // /api/financial/summary
app.use('/api/dashboard', authenticateToken, dashboardRouter); // /api/dashboard/summary

// Mount remaining Prisma API Routers
app.use('/api/purchases', authenticateToken, purchasesRouter);
app.use('/api/expenses', authenticateToken, expensesRouter);
app.use('/api/suppliers', authenticateToken, suppliersRouter);
app.use('/api/memory', authenticateToken, memoryRouter);
app.use('/api/assistant', authenticateToken, assistantRouter);

// Customer Portal API Router (public for customer phone auth)
app.use('/api/customer', customerPortalRouter);

// Public Routes
app.use('/api/auth', authRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Alerts API Router
app.use('/api/alerts', alertsRouter);

// Government Schemes & Subsidies API Router
app.use('/api/schemes', schemesRouter);
app.use('/api/admin/schemes', authenticateToken, adminSchemesRouter);

// Voice Assistant & Speech-to-Text API Router
app.use('/api/voice', voiceRouter);

// Centralized Production AI Gateway
app.use('/api/ai', aiRouter);

// Live Indian Agricultural Market Prices (AGMARKNET / data.gov.in OGD)
app.use('/api/markets', marketRouter);
