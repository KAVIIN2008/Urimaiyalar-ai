// PM2 Ecosystem Config — Cluster Mode for URIMAIYALAR OS
// Runs Node.js server across ALL CPU cores = massive throughput boost
// Usage: npx pm2 start ecosystem.config.cjs
//        npx pm2 stop all
//        npx pm2 monit

const os = require('os');

module.exports = {
  apps: [
    {
      name: 'urimaiyalar-os',
      script: 'dist/server.cjs',
      instances: 'max',              // uses all CPU cores automatically
      exec_mode: 'cluster',          // Node.js cluster mode
      max_memory_restart: '500M',    // auto-restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Log management
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
    }
  ]
};
