module.exports = {
  apps: [
    {
      name: 'chatbot-next',
      script: './node_modules/.bin/next',
      args: 'start -p 3606',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3606,
      },
    },
  ],
};
