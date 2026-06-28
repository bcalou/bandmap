import fs from "node:fs";

const colors = {
  error: "\x1b[31m",
  success: "\x1b[32m",
  warning: "\x1b[33m",
  info: "\x1b[34m",
};

/**
 * Un logger permettant d'afficher des données en direct et de les stocker dans
 * un fichier
 */
export class Logger {
  // The singleton instance
  static instance: Logger;

  // Le chemin du fichier dans lequel stocker les informations
  private filename: string | undefined;

  constructor() {
    if (!!Logger.instance) {
      return Logger.instance;
    }

    Logger.instance = this;
  }

  // Create or reset a file in which the logs will be written
  public initLogFile(filename: string) {
    this.filename = filename;
    fs.writeFileSync(filename, "");
  }

  // Main log function
  public log(message: string, type?: "info" | "error" | "success" | "warning") {
    if (!message) return;

    if (this.filename) {
      fs.appendFileSync(this.filename, message);
    }

    console.log(
      `${type ? colors[type] : ""}${message}${type ? "\x1b[0m" : ""}`
    );
  }

  // Log an error
  public logError(message: string) {
    this.log(message, "error");
  }

  // Log an info
  public logInfo(message: string) {
    this.log(message, "info");
  }

  // Log a success
  public logSuccess(message: string) {
    this.log(message, "success");
  }

  // Log a warning
  public logWarning(message: string) {
    this.log(message, "warning");
  }

  // Log an horizontal line
  public logSeparator() {
    this.log("———————————————————————————————————————————————————————————————");
  }

  // Log a thick horizontal line
  public logThickSeparator() {
    this.log("███████████████████████████████████████████████████████████████");
    this.logSeparator();
  }
}
