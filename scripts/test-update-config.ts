import 'dotenv/config';
import { storage } from "../server/storage";

async function run() {
  try {
    console.log("Attempting to update config...");
    const result = await storage.updateConfiguracoes({
      nomeEscola: "Condofut Academy Test",
      corPrimaria: "#ff0000"
    });
    console.log("Update successful:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Update failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
