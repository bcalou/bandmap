import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logWarning } from "../log";
import { DCVersion, RejectReason } from "../types";
import { Release } from "./Release";

/**
 * A collection of functions used to check the formats of a release and its
 * versions
 */
export class Formats {
  // The associated release
  private release: Release;

  constructor(release: Release) {
    this.release = release;
  }

  get formats() {
    return this.release.releaseFormats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...format.descriptions,
      ],
      []
    );
  }

  // Reject if the release have an invalid format
  public async heuristicRejectFormat(): Promise<RejectReason | null> {
    return this.isValidFormatList(this.formats) ||
      (this.release.masterId &&
        !this.formats.includes("Single") &&
        (await this.hasVersionWithValidFormat()))
      ? null
      : `Rejected format(s): ${this.printFormats(this.formats)}`;
  }

  // Transform a format list to a printable string
  private printFormats(formats?: string[]) {
    return (formats ?? this.formats).join(", ") ?? "not specified";
  }

  // Is this list of formats considered valid for the discogaphy?
  private isValidFormatList(formats: string[]): boolean {
    return (
      !!formats.find((format) => FORMATS.accept.includes(format)) &&
      !formats.find((format) => FORMATS.reject.includes(format))
    );
  }

  // Does one of the version has a valid format list?
  private async hasVersionWithValidFormat(): Promise<boolean> {
    if (!this.release.masterId) return false;

    logWarning(
      `Invalid format(s) (${this.printFormats()}) for "${this.release.title}"`
    );

    for (const version of (await this.release.getVersionsList()).versions) {
      if (await this.isValidFormat(version)) {
        return true;
      }
    }

    return false;
  }

  // Is the format list valid for this version?
  private async isValidFormat(version: DCVersion): Promise<boolean> {
    log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${version.id}`);

    const formats = [...version.major_formats, ...version.format.split(", ")];
    log(`Format: ${this.printFormats(formats)}`);

    return this.isValidFormatList(formats);
  }
}
