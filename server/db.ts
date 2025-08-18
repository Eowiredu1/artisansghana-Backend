// server/db.ts
import dotenv from "dotenv";
dotenv.config(); // <-- MUST be at the very top

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Load the database URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to create a .env file?"
  );
}

// Create a PostgreSQL connection pool
export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
});

// Export the Drizzle database instance
export const db = drizzle(pool);
