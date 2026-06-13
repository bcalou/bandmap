import { fetchRelease, fetchVersions } from "../api";
import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logWarning } from "../log";
import { DCRelease, DCVersion, DCVersions, RejectReason } from "../types";
import { Band } from "./Band";
import { Credits } from "./Credits";

export class Release {
  // The discogs release object
  private release: DCRelease;

  // The main band of the program
  private mainBand: Band;

  // The credits associated to this release
  private credits: Credits;

  // Versions of the same releases
  private versions: Release[] = [];

  // List of versions
  private versionsList: DCVersions | undefined = undefined;

  // The best possible date found for this release
  private date: string | undefined;

  constructor(release: DCRelease, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
    this.credits = new Credits(this);
    this.date = this.release.released;
  }

  get id() {
    return this.masterId ?? this.release.id;
  }

  get masterId() {
    return this.release.master_id;
  }

  get artists() {
    return this.release.artists;
  }

  get formattedArtists() {
    return this.artists.map((artist) => artist.name).join(", ");
  }

  get extraArtists() {
    return this.release.extraartists ?? [];
  }

  get title() {
    return this.release.title;
  }

  get year() {
    return this.date?.slice(0, 4) ?? null;
  }

  get formattedDate() {
    return this.date ?? "unknown date";
  }

  get url() {
    return this.release.uri;
  }

  get label() {
    const artists = this.formattedArtists;
    return `${this.date} - ${artists} - "${this.title}"\n(${this.url})`;
  }

  get formats() {
    return this.release.formats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...format.descriptions,
      ],
      []
    );
  }

  get tracklist() {
    return this.release.tracklist;
  }

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject =
      this.heuristicRejectArtist() ??
      (await this.heuristicRejectFormat()) ??
      (await this.credits.heuristicRejectNoCredits());

    if (reject) return reject;

    await this.extractPreciseDate();

    return this;
  }

  // Return the version list (possibly cached)
  private async getVersionsList(): Promise<DCVersions> {
    if (!this.masterId)
      return { pagination: { pages: 1, items: 0 }, versions: [] };

    if (!this.versionsList) {
      this.versionsList = await fetchVersions(this.masterId);
    }

    log(`🗃️ Looking into ${this.versionsList.pagination.items} version(s)`);

    return this.versionsList;
  }

  // Reject if the release is not by the main band, one of its members, or one
  // of its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this)) {
      return `Rejected artist(s): ${this.formattedArtists}`;
    }

    return null;
  }

  // Reject if the release have an invalid format
  private async heuristicRejectFormat(): Promise<RejectReason | null> {
    if (!this.isValidFormatList(this.formats)) {
      if (this.masterId && !this.formats.includes("Single")) {
        logWarning(
          `Invalid main release format (${this.printFormats(this.formats)})`
        );

        if (await this.hasVersionWithValidFormat()) return null;
      }

      return `Rejected format(s): ${this.printFormats(this.formats)}`;
    }

    return null;
  }

  // Transform a format list to a printable string
  private printFormats(formats: string[]) {
    return formats.join(", ") ?? "not specified";
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
    if (!this.masterId) return false;

    const versionsList =
      this.versionsList ?? (await fetchVersions(this.masterId));

    log(`🗃️ Looking into ${versionsList.pagination.items} version(s)`);

    for (const version of versionsList.versions) {
      if (await this.isValidVersion(version)) {
        return true;
      }
    }

    return false;
  }

  // Is the format list valid for this version?
  private async isValidVersion(version: DCVersion): Promise<boolean> {
    if (version.id === this.id) return false;

    log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${version.id}`);

    const formats = [...version.major_formats, ...version.format.split(", ")];
    log(`Format: ${this.printFormats(formats)}`);

    return this.isValidFormatList(formats);
  }

  // Fetch the version or return the one already fetched
  private async getVersion(versionId: number) {
    let version = this.versions.find(
      (_version) => _version.release.id === versionId
    );

    if (!version) {
      version = new Release(await fetchRelease(versionId), this.mainBand);

      this.versions.push(version);
    }

    log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${version.id}`);

    return version;
  }

  // If the date is not precise, try to find better among versions
  private async extractPreciseDate() {
    if (this.getDateQualityLevel(this.date) !== 3) {
      logWarning(`Imprecise date ${this.date}`);

      for (const version of (await this.getVersionsList()).versions) {
        if (await this.extractVersionDate(version)) return;
      }

      logWarning("No better date found");
    }
  }

  // Use the given version date if it's of better quality than what we have
  // Return true if a better date was found
  private async extractVersionDate(version: DCVersion): Promise<boolean> {
    if (!version.released || (this.year && version.released !== this.year))
      return false;

    const versionRelease = await this.getVersion(version.id);

    const versionDateQuality = this.getDateQualityLevel(versionRelease.date);

    if (versionDateQuality > this.getDateQualityLevel(this.date)) {
      log(`Found better release date: ${versionRelease.date}`);
      this.date = versionRelease.date;

      if (versionDateQuality === 3) return true;
    }

    return false;
  }

  // Get a number reprensenting the quality level of the given date string
  private getDateQualityLevel(date: string | undefined): 0 | 1 | 2 | 3 {
    if (!date) return 0;

    if (date.length === 10) {
      if (!date.endsWith("-00")) {
        return 3;
      }

      return 2;
    }

    return 1;
  }
}
