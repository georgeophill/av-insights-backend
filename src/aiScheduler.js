// src/aiScheduler.js
import cron from "node-cron";
import { spawn } from "node:child_process";
import "dotenv/config";

let isRunning = false;
let currentChild = null;
let task = null;

function runWorkerOnce() {
  if (isRunning) {
    console.log("[ai-scheduler] Skip: worker is already running.");
    return;
  }

  isRunning = true;

  const batchSize = process.env.AI_BATCH_SIZE || "3";
  console.log(`[ai-scheduler] Starting AI worker (AI_BATCH_SIZE=${batchSize})...`);

  currentChild = spawn(
    process.execPath,
    ["src/processors/analyzeArticles.js"],
    {
      stdio: "inherit",
      env: { ...process.env, AI_BATCH_SIZE: batchSize },
    }
  );

  currentChild.on("exit", (code, signal) => {
    console.log(
      `[ai-scheduler] Worker finished (code=${code ?? "null"}, signal=${signal ?? "null"})`
    );
    isRunning = false;
    currentChild = null;
  });

  currentChild.on("error", (err) => {
    console.error("[ai-scheduler] Failed to start worker:", err);
    isRunning = false;
    currentChild = null;
  });
}

function shutdown(signal) {
  console.log(`[ai-scheduler] Received ${signal}. Shutting down...`);

  // Stop future cron ticks
  if (task) task.stop();

  // If worker is running, ask it to terminate gracefully
  if (currentChild && !currentChild.killed) {
    console.log("[ai-scheduler] Stopping running worker (SIGTERM)...");
    currentChild.kill("SIGTERM");

    // Safety: force kill if it doesn't exit in time
    const killTimeout = setTimeout(() => {
      if (currentChild && !currentChild.killed) {
        console.log("[ai-scheduler] Worker did not exit in time. Forcing SIGKILL...");
        currentChild.kill("SIGKILL");
      }
      process.exit(0);
    }, 10_000);

    currentChild.on("exit", () => {
      clearTimeout(killTimeout);
      process.exit(0);
    });

    return;
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C
process.on("SIGTERM", () => shutdown("SIGTERM")); // platform/service stop

// Run once immediately on startup
runWorkerOnce();

// Then run every 10 minutes (adjust later)
task = cron.schedule("*/10 * * * *", () => {
  console.log("[ai-scheduler] Cron tick: attempting to run worker...");
  runWorkerOnce();
});

console.log("[ai-scheduler] Scheduled AI worker: every 10 minutes.");