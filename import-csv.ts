import { getDb } from "./server/queries/connection.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import readline from "readline";

const args = process.argv.slice(2);
const csvFilePath = args[0];
const targetTable = args[1];

if (!csvFilePath || !targetTable) {
  console.log("Uso: npx tsx import-csv.ts <archivo.csv> <tabla>");
  console.log("Tablas soportadas: products, services");
  process.exit(1);
}

async function run() {
  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const db = getDb();
  let headers: string[] = [];
  let isFirstLine = true;
  let count = 0;

  console.log(`Iniciando importación a la tabla: ${targetTable}...`);

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    // Asumimos CSV separado por comas
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
    
    if (isFirstLine) {
      headers = cols;
      isFirstLine = false;
      continue;
    }

    try {
      if (targetTable === "products") {
        // Formato esperado CSV: name, category, brand, price, stock, active
        const [name, category, brand, price, stock, active] = cols;
        await db.execute(sql`
          INSERT INTO products (name, category, brand, price, stock, active) 
          VALUES (${name}, ${category || null}, ${brand || null}, ${price || 0}, ${stock || 0}, ${active === 'false' ? false : true})
        `);
      } else if (targetTable === "services") {
        // Formato esperado CSV: name, durationMinutes, price, active
        const [name, durationMinutes, price, active] = cols;
        await db.execute(sql`
          INSERT INTO services (name, durationMinutes, price, active) 
          VALUES (${name}, ${durationMinutes || 60}, ${price || 0}, ${active === 'false' ? false : true})
        `);
      }
      count++;
    } catch (e: any) {
      console.error(`Error en línea: ${line}`);
      console.error(e.message);
    }
  }

  console.log(`✅ Importación finalizada. ${count} registros insertados en ${targetTable}.`);
  process.exit(0);
}

run();
