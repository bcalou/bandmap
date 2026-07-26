import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { DCFormat, DCVersion, RejectReason } from "../types";
import { GetVersionsOptions } from "./Api";
import { Logger } from "./Logger";
import { Release } from "./Release";

export enum AlbumType {
  NonAlbum = 0,
  Album = 1,
  Multiple = 2,
}

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

  get flattenedFormats() {
    return this.formats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...(format.descriptions ?? []),
      ],
      []
    );
  }

  // Get the format considered to be the main one for this release
  public getMainFormat() {
    return (
      FORMATS.mainSortedByConsiderationOrder.find((format) =>
        this.flattenedFormats.includes(format)
      ) ?? "Unknown"
    );
  }

  // Reject if the release have an invalid format
  public async heuristicFindBestFormatOrReject(): Promise<RejectReason | null> {
    this.logger.log(`💿 Format(s): ${this.printFormats()}`);

    // If this is an album with a valid format list, it's ok
    if (this.getMainFormat() === "Album" && this.isValidFormatList())
      return null;

    // Else try to find an album version with a correct format list
    if (await this.hasValidVersion({ format: "Album" })) return null;

    // Else try to find any version with a correct format list
    return this.isValidFormatList() || (await this.hasValidVersion())
      ? null
      : `Rejected format(s): ${this.printFormats()}`;
  }

  // Look for valid format list in other versions of the release
  private async hasValidVersion(
    options?: GetVersionsOptions
  ): Promise<boolean> {
    const page = options?.page ?? 1;
    const versions = await this.release.getVersions(options);

    for (const version of versions.versions) {
      if (await this.versionHasValidFormat(version)) {
        return true;
      }
    }

    if (versions.pagination.pages > page)
      return await this.hasValidVersion({ ...options, page: page + 1 });

    return false;
  }

  // Is the format list valid for this version?
  private async versionHasValidFormat(version: DCVersion): Promise<boolean> {
    this.logger.log(
      `🗃️ Analyzing main formats of version ${DISCOGS_RELEASE_URL}${version.id}`
    );

    const formats = [...version.major_formats, ...version.format.split(", ")];

    // We can invalidate eliminatory formats based on version format alone
    if (FORMATS.eliminatory.find((format) => formats.includes(format))) {
      this.logger.log(`💿 Format(s): ${formats.join(", ")}}`);
      return false;
    }

    // Else we need more details to validate, as more formats can be included
    return this.versionDetailsHasValidFormat(version);
  }

  // Get the version details and test if the format list is valid
  private async versionDetailsHasValidFormat(
    version: DCVersion
  ): Promise<boolean> {
    const release = await this.release.getVersion(version.id);

    if (!release) return false;

    this.logger.log(`💿 Format(s): ${release.formats.printFormats()}`);

    if (release.formats.isValidFormatList()) {
      this.release.updateRelease(release);
      return true;
    }

    return false;
  }

  // Is this list of formats potentially valid for the discography?
  private isValidFormatList(): boolean {
    // First, eliminate multiple album types (eg compilation of former releases)
    // if (this.getAlbumType() === AlbumType.Multiple) return false;

    // Else, check the format lists one by one
    let valid = false;

    for (const format of this.formats) {
      const formatList = [format.name, ...(format.descriptions ?? [])];

      // Eliminatory format must never be found
      if (formatList.find((format) => FORMATS.eliminatory.includes(format)))
        return false;

      // Valid format must be found once
      if (formatList.find((format) => FORMATS.accept.includes(format)))
        valid = true;
    }

    return valid;
  }

  // Transform a format list to a printable string
  private printFormats() {
    return this.flattenedFormats.join(", ") ?? "not specified";
  }
}
