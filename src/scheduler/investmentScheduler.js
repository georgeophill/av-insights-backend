// src/scheduler/investmentScheduler.js
import cron from "node-cron";
import { updateAllStockData } from "../ingest/stockDataFetcher.js";

// Simple console logger
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};

/**
 * Schedule daily stock price updates
 * Runs at 6 PM ET daily (after markets close at 4 PM ET)
 */
export function scheduleStockUpdates() {
  // Run at 6 PM ET every weekday (Monday-Friday)
  // Cron format: minute hour day month dayOfWeek
  // 0 18 * * 1-5 = 6 PM Monday-Friday
  
  const dailyUpdate = cron.schedule("0 18 * * 1-5", async () => {
    logger.info("Starting scheduled stock price update...");
    
    try {
      const result = await updateAllStockData({ includeFundamentals: false });
      logger.info(`Stock update completed:`, result);
    } catch (error) {
      logger.error("Scheduled stock update failed:", error);
    }
  });

  logger.info("📈 Stock price updates scheduled for 6 PM ET on weekdays");
  
  return dailyUpdate;
}

/**
 * Schedule weekly fundamental data updates
 * Runs on Saturday at 10 AM to update company metrics
 */
export function scheduleWeeklyFundamentals() {
  // Run at 10 AM every Saturday
  const weeklyUpdate = cron.schedule("0 10 * * 6", async () => {
    logger.info("Starting scheduled weekly fundamentals update...");
    
    try {
      const result = await updateAllStockData({ includeFundamentals: true });
      logger.info(`Fundamentals update completed:`, result);
    } catch (error) {
      logger.error("Scheduled fundamentals update failed:", error);
    }
  });

  logger.info("📊 Fundamental data updates scheduled for 10 AM on Saturdays");
  
  return weeklyUpdate;
}

/**
 * Initialize all investment data schedulers
 */
export function initializeInvestmentSchedulers() {
  const schedulers = {
    dailyStockUpdate: scheduleStockUpdates(),
    weeklyFundamentals: scheduleWeeklyFundamentals(),
  };

  logger.info("✅ Investment data schedulers initialized");
  
  return schedulers;
}

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Stopping investment schedulers...");
  process.exit(0);
});
