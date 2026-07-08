import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { DCVersion, RejectReason } from "../types";
import { Logger } from "./Logger";
import { Release } from "./Release";

/**
 * A collection of functions used to check the formats of a release and its
 * versions
 */
export class Formats {
  // The associated release
  private release: Release;

  // The logger object
  private logger: Logger;

  // The main valid format (album, EP...) associated with the release, if any
  public mainFormat: string | undefined;

  constructor(release: Release) {
    this.release = release;
    this.logger = new Logger();
  }

  get formats() {
    return this.release.releaseFormats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...(format.descriptions ?? []),
      ],
      []
    );
  }

  public getMainFormat() {
    return this.mainFormat;
  }

  // Reject if the release have an invalid format
  public async heuristicRejectFormat(): Promise<RejectReason | null> {
    return this.isValidFormatList(this.formats) ||
      (this.release.masterId &&
        !this.isEliminatoryFormatList(this.formats) &&
        (await this.hasVersionWithValidFormat()))
      ? null
      : `Rejected format(s): ${this.printFormats(this.formats)}`;
  }

  // Is the format a core format (exclude secondary formats)
  public isCoreFormat(): boolean {
    return !!this.mainFormat && FORMATS.accept.includes(this.mainFormat);
  }

  // Transform a format list to a printable string
  private printFormats(formats?: string[]) {
    return (formats ?? this.formats).join(", ") ?? "not specified";
  }

  // Is this list of formats potentially valid for the discography?
  private isValidFormatList(formats: string[]): boolean {
    this.mainFormat = formats.find((format) =>
      FORMATS.accept
        .concat(...FORMATS.secondaryOrderedByImportance)
        .includes(format)
    );

    return (
      !!this.mainFormat &&
      !formats.find((format) => FORMATS.reject.includes(format)) &&
      !this.isEliminatoryFormatList(formats)
    );
  }

  // Should we stop looking for other formats when we encounter this one?
  private isEliminatoryFormatList(formats: string[]): boolean {
    return !!formats.find((format) => FORMATS.eliminatory.includes(format));
  }

  // Does one of the version has a valid format list?
  private async hasVersionWithValidFormat(): Promise<boolean> {
    if (!this.release.masterId) return false;

    this.logger.logWarning(
      `Invalid format(s) (${this.printFormats()}) for "${this.release.title}"`
    );

    for (const version of (await this.release.getVersions()).versions) {
      const isValidVersion = this.analyzeVersionFormat(version);

      if (isValidVersion === null) continue;

      return isValidVersion;
    }

    return false;
  }

  // Is the format list valid for this version?
  // Return true if valid, false if eliminatory, else null
  private analyzeVersionFormat(version: DCVersion): boolean | null {
    this.logger.log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${version.id}`);

    const formats = [...version.major_formats, ...version.format.split(", ")];
    this.logger.log(`💿 Format: ${this.printFormats(formats)}`);

    if (this.isEliminatoryFormatList(formats)) {
      return false;
    }

    if (this.isValidFormatList(formats)) {
      return true;
    }

    return null;
  }
}
