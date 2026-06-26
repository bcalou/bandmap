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

  constructor(filename?: string) {
    if (!!Logger.instance) {
      return Logger.instance;
    }

    Logger.instance = this;

    if (filename) {
      this.filename = filename;
      fs.writeFileSync("", filename);
    }
  }

  public log(message: string, type?: "info" | "error" | "success" | "warning") {
    if (!message) return;

    if (this.filename) {
      fs.appendFileSync(this.filename, message);
    }

    console.log(
      `${type ? colors[type] : ""}${message}${type ? "\x1b[0m" : ""}`
    );
  }

  public logError(message: string) {
    this.log(message, "error");
  }

  public logInfo(message: string) {
    this.log(message, "info");
  }

  public logSuccess(message: string) {
    this.log(message, "success");
  }

  public logWarning(message: string) {
    this.log(message, "warning");
  }

  public logSeparator() {
    this.log("———————————————————————————————————————————————————————————————");
  }

  public logThickSeparator() {
    this.log("███████████████████████████████████████████████████████████████");
    this.logSeparator();
  }
}
