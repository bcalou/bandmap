import { fetchArtist, fetchArtistReleases } from "../api";
import { DISCOGS_RELEASE_URL } from "../env";
import { log, logError, logSeparator, logSuccess } from "../log";
import { Artist, ArtistReleases, Release } from "../types";
import { ReleaseManager } from "./Release";

export class ArtistManager {
  private id: number;
  private artist: Promise<Artist>;
  private validReleases: Release[] = [];
  private matchResultAgainst: string | undefined;

  constructor(id: number, matchResultAgainst?: string) {
    this.id = id;
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

    await this.analyzeReleases(1);

    this.sortReleases();
    this.logDiscography();
    this.logDiscographyAsIdList();
  }

  /**
   * Create a ReleaseManager to analyze each of the artist releases
   */
  private async analyzeReleases(page: number) {
    const artistReleases = await fetchArtistReleases(this.id, page);

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
            release.id === (artistRelease.main_release ?? artistRelease.id)
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

    if (artistReleases.pagination.pages > page) {
      await this.analyzeReleases(page + 1);
    }
  }

  /**
   * Sort the releases by release date
   */
  private async sortReleases() {
    this.validReleases.sort((release1, release2) =>
      ReleaseManager.getReleaseDate(release1).localeCompare(
        ReleaseManager.getReleaseDate(release2)
      )
    );
  }

  /**
   * Nicely log the final releases array
   */
  private logDiscography() {
    logSeparator();
    log(`CHRONOLOGICAL DISCOGRAPHY (${this.validReleases.length} entries(s)):`);
    this.validReleases.forEach((release) => {
      logSuccess(
        `${ReleaseManager.getReleaseDate(release)} - ${
          release.artists[0].name
        } - ${release.title} (${DISCOGS_RELEASE_URL}${release.id})`
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
