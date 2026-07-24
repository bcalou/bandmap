import { DISCOGS_RELEASE_URL, FORMATS, OPTION_FORMATS_PRIORITY } from "../env";
import { DCFormat, DCVersion, RejectReason } from "../types";
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
    return this.release.releaseFormats;
  }

  public getMainFormat() {
    return this.mainFormat;
  }

  // Reject if the release have an invalid format
  public async heuristicRejectFormat(): Promise<RejectReason | null> {
    return this.isValidFormatList(this.formats) ||
      (this.release.masterId && (await this.hasVersionWithValidFormat()))
      ? null
      : `Rejected format(s): ${this.printFormats(
          this.flattenFormats(this.formats)
        )}`;
  }

  // Transform a list of structured formats into an flat array of strings
  private flattenFormats(formats: DCFormat[]): string[] {
    return formats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...(format.descriptions ?? []),
      ],
      []
    );
  }

  // Transform a format list to a printable string
  private printFormats(formats: string[]) {
    return formats.join(", ") ?? "not specified";
  }

  // Is this list of formats potentially valid for the discography?
  private isValidFormatList(formats: DCFormat[]): boolean {
    this.updateMainFormat(formats);

    let valid = false;

    for (const format of formats) {
      const formatList = [format.name, ...(format.descriptions ?? [])];

      // Eliminatory format must never be found
      if (formatList.find((format) => FORMATS.eliminatory.includes(format)))
        return false;

      // Valid format (= not rejected) must be found once
      if (!formatList.find((format) => FORMATS.reject.includes(format)))
        valid = true;
    }

    return valid;
  }

  // Set the main format for the release based on the given list of formats
  private updateMainFormat(formats: DCFormat[]) {
    const flattenedFormats = this.flattenFormats(formats);
    this.mainFormat =
      FORMATS.mainSortedByConsiderationOrder.find((format) =>
        flattenedFormats.includes(format)
      ) ?? "Unknown";
  }

  // Look for valid format list in other versions of the release
  private async hasVersionWithValidFormat(page = 1): Promise<boolean> {
    const versions = await this.release.getVersions(page);

    for (const version of versions.versions) {
      if (await this.versionHasValidFormat(version)) {
        return true;
      }
    }

    if (versions.pagination.pages > page)
      return await this.hasVersionWithValidFormat(page + 1);

    return false;
  }

  // Is the format list valid for this version?
  private async versionHasValidFormat(version: DCVersion): Promise<boolean> {
    this.logger.log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${version.id}`);

    const formats = [...version.major_formats, ...version.format.split(", ")];

    // We can invalidate eliminatory formats based on version format alone
    if (FORMATS.eliminatory.find((format) => formats.includes(format))) {
      this.logger.log(`💿 Format(s): ${this.printFormats(formats)}`);
      return false;
    }

    // Else we need more details to validate, as more formats can be included
    return this.versionDetailsHasValidFormat(version);
  }

  // Get the version details and test if the format list is valid
  private async versionDetailsHasValidFormat(
    version: DCVersion
  ): Promise<boolean> {
    const versionRelease = await this.release.getVersion(version.id);

    if (!versionRelease) return false;

    const releaseFormats = new Formats(versionRelease).formats;
    this.logger.log(
      `💿 Format(s): ${this.printFormats(this.flattenFormats(releaseFormats))}`
    );

    return this.isValidFormatList(releaseFormats);
  }
}
