// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:3001/api',
  },
});