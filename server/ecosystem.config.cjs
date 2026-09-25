// PM2 process config for production: `pm2 start ecosystem.config.cjs`
// One instance on purpose — online presence is kept in memory (a cluster would need Redis first).
module.exports = {
  apps: [
    {
      name: 'grove',
      script: 'dist/server.js',
      cwd: __dirname,
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      kill_timeout: 10000, // matches the graceful-shutdown timeout in server.ts
      time: true, // timestamps in `pm2 logs grove`
    },
  ],
};
