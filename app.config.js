// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'https://back-end-purple-log-1280.fly.dev/api',
  },
});