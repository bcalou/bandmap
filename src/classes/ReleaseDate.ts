import { log, logWarning } from "../log";
import { DCVersion } from "../types";
import { Release } from "./Release";

enum DateQuality {
  Perfect = 4,
  MonthOnly = 3,
  StartOfYear = 2,
  YearOnly = 1,
  None = 0,
}

/**
 * A collection of functions used to extract the precise date for a release
 */
export class ReleaseDate {
  // The associated release
  private release: Release;

  // The best date found for this release
  private date: string | undefined;

  constructor(release: Release) {
    this.release = release;
    this.date = this.release.released;
  }

  get year() {
    return this.date?.slice(0, 4) ?? null;
  }

  get formattedDate() {
    return this.date ?? "unknown date";
  }

  // If the date is not precise, try to find better among versions
  public async extractPreciseDate() {
    const initialDateQuality = this.getDateQuality(this.date);

    if (!this.isSufficientDateQuality(initialDateQuality)) {
      logWarning(
        `🗓️ Imprecise date (${this.date}) for "${this.release.title}"`
      );

      await this.findBetterDate();

      if (this.getDateQuality(this.date) === initialDateQuality) {
        logWarning("🗓️ No better date found");
      }
    }
  }

  // Find a better date for the release
  private async findBetterDate(): Promise<void> {
    for (const version of (await this.release.getVersionsList()).versions) {
      if (this.year && version.released !== this.year) {
        logWarning(`🗓️ No more versions for year ${this.year}`);
        break;
      }

      const dateQuality = await this.extractVersionDate(version);

      if (dateQuality && this.isSufficientDateQuality(dateQuality)) {
        return;
      }
    }
  }

  // Is the date quality considered good enough
  private isSufficientDateQuality(quality: DateQuality) {
    return quality >= DateQuality.MonthOnly;
  }

  // Use the given version date if it's of better quality than what we have
  // Return the quality of the date found, or null if the date is not better
  private async extractVersionDate(
    version: DCVersion
  ): Promise<DateQuality | null> {
    const versionRelease = await this.release.getVersion(version.id);

    if (!versionRelease) return null;

    const dateQuality = this.getDateQuality(versionRelease.released);
    log(`🗓️ Release date: ${versionRelease.released}`);

    if (dateQuality > this.getDateQuality(this.date)) {
      log(`Found better release date: ${versionRelease.released}`);
      this.date = versionRelease.released;

      return dateQuality;
    }

    return null;
  }

  // Get a number reprensenting the quality level of the given date string
  private getDateQuality(date: string | undefined): DateQuality {
    if (!date) return DateQuality.None;

    if (date.length === 10) {
      if (date.endsWith("01-01")) return DateQuality.StartOfYear;
      if (date.endsWith("00")) return DateQuality.MonthOnly;
      return DateQuality.Perfect;
    }

    return DateQuality.YearOnly;
  }
}
