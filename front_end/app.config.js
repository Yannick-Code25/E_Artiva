// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'https://e-artiva-htaw.onrender.com/api',
  },
});