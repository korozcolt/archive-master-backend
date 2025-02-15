module.exports = {
  apps: [
    {
      name: 'archive-master-api',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/dev/stdout',
      out_file: '/dev/stdout',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 4000,
      wait_ready: true,
      kill_timeout: 3000,
      listen_timeout: 12000,
    },
  ],
};
