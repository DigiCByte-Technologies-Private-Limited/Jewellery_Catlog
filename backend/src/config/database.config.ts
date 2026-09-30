import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: (process.env.DB_TYPE || 'postgres') as any,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (process.env.DB_TYPE === 'mysql' ? '3306' : '5432'), 10),
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'app_db',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production', // auto-creates tables in dev
  logging: process.env.NODE_ENV === 'development',
}));
