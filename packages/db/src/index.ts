import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
export * from "./schema.js";
// Re-export drizzle query helpers so consumers don't need drizzle-orm as a direct dep
export { eq, and, or, desc, asc, sql } from "drizzle-orm";
