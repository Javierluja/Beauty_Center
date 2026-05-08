import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env.js";

import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

const fullSchema = { ...schema, ...relations };

let instance: any;

export function getDb() {
  if (!instance) {
    const pool = mysql.createPool({
      uri: env.databaseUrl,
      ssl: {
        rejectUnauthorized: true,
      },
      connectionLimit: 5,
    });

    instance = drizzle(pool, {
      schema: fullSchema,
      mode: "default",
    });
  }

  return instance;
}

