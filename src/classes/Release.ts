import { fetchRelease, fetchVersions, PER_PAGE } from "../api";
import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logError, logWarning } from "../log";
import { DCRelease, DCVersion, DCVersions, RejectReason } from "../types";
import { Band } from "./Band";
import { Credits } from "./Credits";
import { Formats } from "./Formats";
import { ReleaseDate } from "./ReleaseDate";

export class Release {
  // The discogs release object
  private release: DCRelease;

  // The main band of the program
  private mainBand: Band;

  // The formats associated to this release
  private formats: Formats;

  // The credits associated to this release
  private credits: Credits;

  // The release date utility object
  private releaseDate: ReleaseDate;

  // Versions of the same releases
  private versions: Release[] = [];

  // List of versions
  private versionsList: DCVersions | undefined = undefined;

  constructor(release: DCRelease, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
    this.credits = new Credits(this, this.mainBand);
    this.formats = new Formats(this);
    this.releaseDate = new ReleaseDate(this);
  }

  get id() {
    return this.release.id;
  }

  get masterId() {
    return this.release.master_id;
  }

  get discographyId() {
    return this.masterId ?? this.release.id;
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

  get formattedCredits() {
    return this.credits.formattedCredits;
  }

  get title() {
    return this.release.title;
  }

  get released() {
    return this.release.released;
  }

  get formattedDate() {
    return this.releaseDate.formattedDate;
  }

  get url() {
    return this.release.uri;
  }

  get label() {
    const artists = this.formattedArtists;
    const date = this.releaseDate.formattedDate;
    return `${date} - ${artists} - "${this.title}"\n(${this.url})`;
  }

  get releaseFormats() {
    return this.release.formats;
  }

  get tracklist() {
    return this.release.tracklist;
  }

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject =
      this.heuristicRejectArtist() ??
      (await this.formats.heuristicRejectFormat()) ??
      (await this.credits.heuristicRejectNoCredits());

    if (reject) return reject;

    await this.releaseDate.extractPreciseDate();

    return this;
  }

  // Return the version list (possibly cached)
  public async getVersionsList(): Promise<DCVersions> {
    if (!this.versionsList) this.versionsList = await this.fetchVersions();

    const count = this.versionsList.pagination.items;

    if (count === 0) return this.versionsList;

    log(
      `🗃️ Looking at ${count} alternate version(s)${
        count > PER_PAGE ? ` (limiting to ${PER_PAGE})` : ""
      }`
    );

    return this.versionsList;
  }

  // Fetch the version or return the one already fetched
  public async getVersion(versionId: number): Promise<Release | null> {
    log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${versionId}`);

    let version = this.versions.find(
      (_version) => _version.release.id === versionId
    );

    return version ?? this.fetchVersion(versionId);
  }

  // Fetch a version and add it to the cached versions
  private async fetchVersion(versionId: number): Promise<Release | null> {
    try {
      const version = new Release(await fetchRelease(versionId), this.mainBand);
      this.versions.push(version);
      return version;
    } catch (error) {
      if (typeof error === "string") {
        logError(error);
      }
      return null;
    }
  }

  // Shortcut to the credit extract method for this release
  public extractCredits() {
    return this.credits.extractCredits();
  }

  // Fetch the versions list and remove the version matching the current release
  private async fetchVersions(): Promise<DCVersions> {
    if (!this.masterId)
      return { pagination: { pages: 1, items: 0 }, versions: [] };

    const versions = await fetchVersions(this.masterId);
    versions.versions = versions.versions.filter(
      (version) => version.id !== this.id
    );
    versions.pagination.items--;

    return versions;
  }

  // Reject if the release is not by the main band, one of its members, or one
  // of its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this)) {
      return `Rejected artist(s): ${this.formattedArtists}`;
    }

    return null;
  }
}
