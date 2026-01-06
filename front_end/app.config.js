// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://192.168.11.111:3001/api',
  },
});