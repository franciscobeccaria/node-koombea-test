import { GenericContainer, Wait } from 'testcontainers';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let postgresContainer;
let databaseUrl;

/**
 * Start a PostgreSQL test container
 */
export const startTestDatabase = async () => {
  try {
    const container = new GenericContainer('postgres:15-alpine')
      .withEnvironment('POSTGRES_DB', 'test_db')
      .withEnvironment('POSTGRES_USER', 'testuser')
      .withEnvironment('POSTGRES_PASSWORD', 'testpass')
      .withExposedPorts(5432);

    postgresContainer = await container.start();

    const host = postgresContainer.getHost();
    const port = postgresContainer.getMappedPort(5432);

    databaseUrl = `postgresql://testuser:testpass@${host}:${port}/test_db`;

    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Run Prisma migrations
    process.env.DATABASE_URL = databaseUrl;

    console.log(`Test database started at ${databaseUrl}`);

    return databaseUrl;
  } catch (error) {
    console.error('Failed to start test database:', error);
    throw error;
  }
};

/**
 * Stop the PostgreSQL test container
 */
export const stopTestDatabase = async () => {
  if (postgresContainer) {
    try {
      await postgresContainer.stop();
      console.log('Test database stopped');
    } catch (error) {
      console.error('Failed to stop test database:', error);
      throw error;
    }
  }
};

/**
 * Get the database URL
 */
export const getTestDatabaseUrl = () => {
  return databaseUrl;
};

/**
 * Reset the database (run migrations)
 */
export const resetTestDatabase = async () => {
  if (!databaseUrl) {
    throw new Error('Database not started');
  }

  try {
    process.env.DATABASE_URL = databaseUrl;
    // Run db reset using Prisma
    await execAsync('npx prisma db push --skip-generate --force-reset', {
      cwd: process.cwd(),
    });
    console.log('Test database reset');
  } catch (error) {
    console.error('Failed to reset test database:', error);
    throw error;
  }
};
