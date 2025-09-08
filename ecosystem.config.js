module.exports = {
  apps: [
    {
      name: 'goshuin-app',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      out_file: './logs/goshuin-app-out.log',
      error_file: './logs/goshuin-app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
