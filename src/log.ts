const colors = {
  error: "\x1b[31m",
  success: "\x1b[32m",
  warning: "\x1b[33m",
  info: "\x1b[34m",
};

export function log(
  message: string,
  type?: "info" | "error" | "success" | "warning"
) {
  if (!message) return;

  console.log(`${type ? colors[type] : ""}${message}${type ? "\x1b[0m" : ""}`);
}

export function logError(message: string) {
  log(message, "error");
}

export function logInfo(message: string) {
  log(message, "info");
}

export function logSuccess(message: string) {
  log(message, "success");
}

export function logWarning(message: string) {
  log(message, "warning");
}

export function logSeparator() {
  log(
    "——————————————————————————————————————————————————————————————————————————"
  );
}
