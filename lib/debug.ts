// Simple debug utility that only logs in development or when explicitly enabled

const isDebugMode =
  process.env.NODE_ENV !== "production" || process.env.DEBUG === "true";

export const debug = {
  log: (...args: any[]) => {
    if (isDebugMode) {
      console.log("[DEBUG]", ...args);
    }
  },
  error: (...args: any[]) => {
    if (isDebugMode) {
      console.error("[DEBUG ERROR]", ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDebugMode) {
      console.warn("[DEBUG WARN]", ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDebugMode) {
      console.info("[DEBUG INFO]", ...args);
    }
  },
};
