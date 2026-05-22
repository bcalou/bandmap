import { fetchArtist, fetchArtistReleases } from "../api";
import { DISCOGS_RELEASE_URL } from "../env";
import { log, logError, logSeparator, logSuccess } from "../log";
import { Artist, ArtistReleases, Release } from "../types";
import { ReleaseManager } from "./Release";

export class ArtistManager {
  private artist: Promise<Artist>;
  private artistReleases: Promise<ArtistReleases>;
  private validReleases: Release[] = [];
  private matchResultAgainst: string | undefined;

  constructor(id: number, matchResultAgainst?: string) {
    this.matchResultAgainst = matchResultAgainst;
    this.artist = fetchArtist(id);
    this.artistReleases = fetchArtistReleases(id);
    this.init();
  }

  /**
   * Main sequence
   */
  async init() {
    const artist = await this.artist;
    logSuccess(`Fetched artist ${artist.id}: "${artist.name}"`);

    await this.analyzeReleases();
  }

  /**
   * Create a ReleaseManager to analyze each of the artist releases
   */
  async analyzeReleases() {
    logSuccess(
      `${(await this.artistReleases).pagination.items} release(s) fetched`,
    );

    for (const artistRelease of (await this.artistReleases).releases) {
      if (
        this.validReleases.find(
          (release) => release.id === artistRelease.main_release,
        )
      ) {
        log(`↷ "${artistRelease.title}" (skipping, already included)`);
        continue;
      }

      const release = new ReleaseManager(artistRelease, await this.artist);

      const validatedRelease = await release.getValidatedRelease();

      if (validatedRelease) {
        this.validReleases.push(validatedRelease);
      }
    }

    this.sortReleases();
    this.logDiscography();
    this.logDiscographyAsIdList();
  }

  /**
   * Sort the releases by release date
   */
  private async sortReleases() {
    this.validReleases.sort((release1, release2) =>
      ReleaseManager.getReleaseDate(release1).localeCompare(
        ReleaseManager.getReleaseDate(release2),
      ),
    );
  }

  /**
   * Nicely log the final releases array
   */
  private logDiscography() {
    logSeparator();
    log(`CHRONOLOGICAL DISCOGRAPHY (${this.validReleases.length} album(s)):`);
    this.validReleases.forEach((release) => {
      logSuccess(
        `${ReleaseManager.getReleaseDate(release)} - ${
          release.artists[0].name
        } - ${release.title} (${DISCOGS_RELEASE_URL}${release.id})`,
      );
    });
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
        log(`Current value: ${idList}`);
      }
    } else {
      console.log(idList);
    }
  }
}
