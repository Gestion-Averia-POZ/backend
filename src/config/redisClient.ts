// src/config/redis.js
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuramos el cliente una sola vez
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default redis;