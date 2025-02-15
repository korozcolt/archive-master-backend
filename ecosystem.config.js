module.exports = {
  apps: [
    {
      name: 'archive-master-api',
      script: './dist/src/main.js',
      instances: 1, // Cambiado a 1 para debugging
      exec_mode: 'fork', // Cambiado a fork para debugging
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/usr/src/app/logs/error.log',
      out_file: '/usr/src/app/logs/output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 4000,
      wait_ready: true,
      kill_timeout: 3000,
      listen_timeout: 12000,
      // Añadir estas opciones para mejor debugging
      trace: true,
      no_daemon: true,
    },
  ],
};
