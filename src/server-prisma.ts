import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './expressApp';
import { bootstrapEventEngine } from './services/eventEngine';
import { bootstrapDefaultWorkflows } from './services/workflowEngine';
import { bootstrapVerifiedSchemes } from './services/schemesDbService';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Bootstrap event-driven automation and verified schemes before any requests
bootstrapEventEngine();
bootstrapDefaultWorkflows();
bootstrapVerifiedSchemes();

import { createServer as createViteServer } from 'vite';

// Async function to start server with Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    // Setup Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Single Page App serving
    const distPath = path.join(currentDir, '../dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[URIMAIYALAR AI] Production Server running heavily scaled at 0.0.0.0:${PORT}`);
  });
}

startServer();
