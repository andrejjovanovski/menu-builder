import dotenv from "dotenv";
import { spawn } from "node:child_process";

dotenv.config({ path: ".env.local" });
dotenv.config();

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

await run("node", ["scripts/migrate-auth.mjs"]);
await run("node", ["scripts/apply-app-schema.mjs"]);

console.log("Local database bootstrap complete");
