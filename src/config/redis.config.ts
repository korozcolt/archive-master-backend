import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  ttl: parseInt(process.env.REDIS_TTL, 10) || 3600, // Tiempo de vida en segundos
  max: parseInt(process.env.REDIS_MAX_CONNECTIONS, 10) || 100,
}));