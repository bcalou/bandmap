import { DISCOGS_RELEASE_URL, GENRES } from "../env";
import { DCRelease, DCVersions, RejectReason } from "../types";
import { removeNumberInParenthesis } from "../utils";
import { Api } from "./Api";
import { Band } from "./Band";
import { Credits } from "./Credits";
import { Formats } from "./Formats";
import { Logger } from "./Logger";
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

  // List of versions pages
  private versionsList: DCVersions[] = [];

  // The api object
  private api: Api;

  // The logger object
  private logger: Logger;

  constructor(release: DCRelease, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
    this.credits = new Credits(this, this.mainBand);
    this.formats = new Formats(this);
    this.releaseDate = new ReleaseDate(this);
    this.api = new Api();
    this.logger = new Logger();
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

  get genres() {
    return this.release.genres ?? [];
  }

  get country() {
    return this.release.country;
  }

  get formattedArtists() {
    return this.artists
      .map((artist) => removeNumberInParenthesis(artist.name))
      .join(", ");
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

  get year() {
    return this.releaseDate.year;
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
    const format =
      this.getMainFormat() === "Album" ? "" : ` (${this.getMainFormat()})`;
    return `${date} - ${artists} - "${this.title}${format}"\n(${this.url})`;
  }

  get releaseFormats() {
    return this.release.formats;
  }

  get tracklist() {
    return this.release.tracklist;
  }

  // Get the main band associated to this release
  public getMainBand() {
    return this.mainBand;
  }

  // Return release object if it's considered acceptable
  public async getCandidateRelease(): Promise<Release | RejectReason> {
    return (
      this.heuristicRejectArtist() ??
      this.heuristicRejectGenre() ??
      (await this.formats.heuristicRejectFormat()) ??
      this
    );
  }

  // Return the version list (possibly cached)
  public async getVersions(page = 1): Promise<DCVersions> {
    if (!this.versionsList[page - 1])
      this.versionsList[page - 1] = await this.fetchVersions(page);

    const count = this.versionsList[page - 1].pagination.items;

    if (count === 0) return this.versionsList[page - 1];

    if (page === 1) {
      this.logger.log(`🗃️ Looking at ${count} alternate version(s)`);
    }

    return this.versionsList[page - 1];
  }

  // Fetch the version or return the one already fetched
  public async getVersion(versionId: number): Promise<Release | null> {
    this.logger.log(`🗃️ Analyzing version ${DISCOGS_RELEASE_URL}${versionId}`);

    let version = this.versions.find(
      (_version) => _version.release.id === versionId
    );

    return version ?? this.fetchVersion(versionId);
  }

  // Shortcut to the credit extract method for this release
  public extractCredits() {
    return this.credits.extractCredits();
  }

  // Get the main format for this release
  public getMainFormat() {
    return this.formats.getMainFormat();
  }

  // Extract the precise date for this release
  public async extractPreciseDate() {
    await this.releaseDate.extractPreciseDate();
  }

  // Fetch a version and add it to the cached versions
  private async fetchVersion(versionId: number): Promise<Release> {
    const version = new Release(
      await this.api.getRelease(versionId),
      this.mainBand
    );
    this.versions.push(version);
    return version;
  }

  // Fetch the versions list and remove the version matching the current release
  private async fetchVersions(page = 1): Promise<DCVersions> {
    if (!this.masterId)
      return { pagination: { pages: 1, items: 0 }, versions: [] };

    const versions = await this.api.getVersions(this.masterId, page);
    versions.versions = versions.versions.filter(
      (version) => version.id !== this.id
    );

    if (versions.pagination.items) {
      versions.pagination.items--;
    }

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

  // Reject if the master contains non-music only
  private heuristicRejectGenre(): RejectReason | null {
    if (!!this.genres.find((genre) => GENRES.reject.includes(genre))) {
      return `Rejected genre(s): ${this.genres}`;
    }

    return null;
  }
}
