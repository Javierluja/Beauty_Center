import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: any;

export function getDb() {
  if (!instance) {
    // Cambiamos el modo a 'default' para máxima compatibilidad con TiDB
    instance = drizzle(env.databaseUrl, {
      schema: fullSchema,
      mode: "default", 
    });
  }
  return instance;
}
