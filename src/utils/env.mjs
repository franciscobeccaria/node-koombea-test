import dotenv from 'dotenv';

dotenv.config();

const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
};

export default ENV;
