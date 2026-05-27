import { fetchArtist, fetchArtistReleases } from "../api";
import { DISCOGS_RELEASE_URL } from "../env";
import {
  log,
  logError,
  logInfo,
  logSeparator,
  logSuccess,
  logWarning,
} from "../log";
import { Artist, ArtistRelease, ArtistReleases, Release } from "../types";
import { ReleaseManager } from "./Release";

export class ArtistManager {
  private artist: Promise<Artist>;
  private validReleases: Release[] = [];
  private invalidReleases: ArtistRelease[] = [];
  private matchResultAgainst: string | undefined;

  constructor(id: number, matchResultAgainst?: string) {
    this.matchResultAgainst = matchResultAgainst;
    this.artist = fetchArtist(id);
    this.init();
  }

  /**
   * Main sequence
   */
  async init() {
    const artist = await this.artist;
    logSuccess(`Fetched artist ${artist.id}: "${artist.name}"`);

    if (artist.aliases) {
      for (const alias of artist.aliases) {
        logSeparator();
        logInfo(`Looking into alias ${alias.name}`);

        await this.analyzeReleases(alias.id, 1);
      }
    }

    await this.analyzeReleases(artist.id, 1);

    this.sortReleases(this.invalidReleases);
    this.logDiscography(this.invalidReleases, "REJECTED RELEASES", logWarning);

    this.sortReleases(this.validReleases);
    this.logDiscography(
      this.validReleases,
      "CHRONOLOGICAL DISCOGRAPHY",
      logSuccess
    );
    this.logDiscographyAsIdList();
  }

  /**
   * Create a ReleaseManager to analyze each of the artist releases
   */
  private async analyzeReleases(artistId: number, page: number) {
    const artistReleases = await fetchArtistReleases(artistId, page);

    if (page === 1) {
      logSuccess(`${artistReleases.pagination.items} release(s) fetched`);
    }

    for (const artistRelease of artistReleases.releases) {
      const mainReleaseId = artistRelease.main_release ?? artistRelease.id;
      logSeparator();
      const url = `${DISCOGS_RELEASE_URL}${mainReleaseId}`;
      log(`Analyzing artist release ${artistRelease.id} (${url})`);

      if (
        this.validReleases.find(
          (release) =>
            release.id === artistRelease.id ||
            release.master_id === artistRelease.id
        )
      ) {
        log(`↷ "${artistRelease.title}" (skipping, already included)`);
        continue;
      }

      const release = new ReleaseManager(artistRelease, await this.artist);

      const validatedRelease = await release.getValidatedRelease();

      if (validatedRelease) {
        this.validReleases.push(validatedRelease);
      } else {
        this.invalidReleases.push(artistRelease);
      }
    }

    if (artistReleases.pagination.pages > page) {
      await this.analyzeReleases(artistId, page + 1);
    }
  }

  /**
   * Sort the releases by release date
   */
  private async sortReleases(releases: Release[] | ArtistRelease[]) {
    releases.sort((release1, release2) =>
      this.getReleaseDate(release1).localeCompare(this.getReleaseDate(release2))
    );
  }

  /**
   * Nicely log the final releases array
   */
  private logDiscography(
    releases: Release[] | ArtistRelease[],
    label: string,
    logger: (message: string) => void
  ) {
    logSeparator();
    log(`${label} (${releases.length} entries(s)):`);
    releases.forEach((release) => {
      logger(
        `${this.getReleaseDate(release)} - ${this.getArtist(release)} - ${
          release.title
        } (${this.getUrl(release)})`
      );
    });
  }

  /**
   * Get the release date/year of a release or artist release
   */
  private getReleaseDate(release: Release | ArtistRelease): string {
    return (
      ("released" in release ? release.released : release.year?.toString()) ??
      "unknown"
    );
  }

  /** Get the artist of a release or artist release */
  private getArtist(release: Release | ArtistRelease): string {
    return "artists" in release
      ? release.artists.map((artist) => artist.name).join(", ")
      : release.artist;
  }

  /** Get the url of a release or artist release */
  private getUrl(release: Release | ArtistRelease): string {
    return `${DISCOGS_RELEASE_URL}${
      "main_release" in release ? release.main_release : release.id
    }`;
  }

  private logDiscographyAsIdList() {
    const idList = this.validReleases.map((release) => release.id).join(",");

    logSeparator();
    log("Discography IDs list:");

    if (this.matchResultAgainst) {
      if (idList === this.matchResultAgainst) {
        logSuccess(`✓ IDs list matches the expected result: ${idList}`);
      } else {
        logError(`❌ IDs list doesn't match the expected result`);
        log(`Expected: ${this.matchResultAgainst}`);
        log(`Got:      ${idList}`);
      }
    } else {
      console.log(idList);
    }
  }
}
