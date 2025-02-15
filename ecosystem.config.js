module.exports = {
  apps: [
    {
      name: 'archive-master-api',
      script: './dist/src/main.js',
      instances: 1, // Un solo proceso para evitar problemas de concurrencia
      exec_mode: 'fork', // Modo fork en lugar de cluster
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      combine_logs: true,
      // Usar directamente stdout/stderr de Docker
      output: '/dev/stdout',
      error: '/dev/stderr',
      max_restarts: 10,
      restart_delay: 4000,
      wait_ready: true,
      kill_timeout: 3000,
      listen_timeout: 12000,
    },
  ],
};
