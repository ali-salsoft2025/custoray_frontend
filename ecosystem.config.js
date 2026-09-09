module.exports = {
  apps: [
    {
      name: "custoray_frontend_dev",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3035",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3035,
        NODE_OPTIONS: "--max-old-space-size=8192",
      },
    },
  ],
};
