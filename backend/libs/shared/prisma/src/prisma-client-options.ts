import { PrismaPg } from '@prisma/adapter-pg';
import type { Prisma } from '@prisma/client';
import { Pool } from 'pg';

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize PrismaClient');
  }

  return databaseUrl;
}

export function createPrismaClientOptions(
  options: Prisma.PrismaClientOptions = {},
): Prisma.PrismaClientOptions {
  return {
    ...options,
    adapter: new PrismaPg(
      new Pool({
        connectionString: getDatabaseUrl(),
      }),
    ),
  };
}
