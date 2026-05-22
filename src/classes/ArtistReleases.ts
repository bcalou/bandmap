import z from "zod";
import { fetchArtistReleases } from "../api";
import { ARTIST_RELEASE_ROLES, DISCOGS_RELEASE_URL } from "../env";
import { log, logError, logSeparator, logSuccess, logWarning } from "../log";
import { Release, ReleaseManager } from "./Release";

export type ArtistRelease = z.infer<typeof ArtistRelease>;
export const ArtistRelease = z.object({
  id: z.number(),
  title: z.string(),
  type: z.literal(["master", "release"]),
  main_release: z.number().optional(),
  role: z.literal(
    [
      "Main",
      "Appearance",
      "TrackAppearance",
      "UnofficialRelease",
      "Producer",
      "Mixed by",
    ],
    { error: (iss) => `role "${iss.input}" not listed` }
  ),
});

export type ArtistReleases = z.infer<typeof ArtistReleases>;
export const ArtistReleases = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  releases: z.array(ArtistRelease),
});

export class ArtistReleasesManager {
  private artistId: number;
  private matchResultAgainst: string | undefined;
  private artistReleases: Promise<ArtistReleases>;
  private validatedReleases: Release[] = [];

  constructor(artistId: number, matchResultAgainst?: string) {
    this.artistId = artistId;
    this.matchResultAgainst = matchResultAgainst;
    this.artistReleases = fetchArtistReleases(artistId);
    this.init();
  }

  /**
   * Main sequence
   */
  private async init() {
    const artistReleases = await this.artistReleases;

    // if (artistReleases.pagination.pages > 1) {
    //   throw new Error("Multiple page not handled yet!");
    // }

    logSuccess(`${artistReleases.pagination.items} release(s) fetched`);

    for (const artistRelease of artistReleases.releases) {
      await this.analyzeArtistRelease(artistRelease);
    }

    this.sortReleases();
    this.logDiscography();
    this.logDiscographyAsIdList();
  }

  /**
   * Analyze an artist's release summary
   * Reject it if necessary, otherwise look into the associated main release
   */
  private async analyzeArtistRelease(artistRelease: ArtistRelease) {
    logSeparator();
    const url = `${DISCOGS_RELEASE_URL}${this.getMainReleaseId(artistRelease)}`;

    log(`Analyzing artist release ${artistRelease.id} (${url})`);

    if (
      this.validatedReleases.find(
        (release) => release.id === artistRelease.main_release
      )
    ) {
      log(`↷ "${artistRelease.title}" (skipping, already included)`);
      return;
    }

    if (ARTIST_RELEASE_ROLES.reject.includes(artistRelease.role)) {
      logWarning(`❌ "${artistRelease.title}" (role: ${artistRelease.role})`);
      return;
    }

    const releaseManager = new ReleaseManager(
      this.getMainReleaseId(artistRelease),
      this.artistId
    );

    const validatedRelease = await releaseManager.getValidatedRelease();

    if (!validatedRelease) {
      return;
    }

    logSuccess(`✓ "${validatedRelease.title}"`);
    this.validatedReleases.push(validatedRelease);
  }

  /**
   * Get the ID of the main release (if none is present, return the id of the
   * artist release itself)
   */
  private getMainReleaseId(artistRelease: ArtistRelease): number {
    return artistRelease.main_release ?? artistRelease.id;
  }

  /**
   * Sort the releases by release date
   */
  private async sortReleases() {
    this.validatedReleases.sort((release1, release2) =>
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
    log(
      `CHRONOLOGICAL DISCOGRAPHY (${this.validatedReleases.length} album(s)):`
    );
    this.validatedReleases.forEach((release) => {
      logSuccess(
        `${ReleaseManager.getReleaseDate(release)} - ${
          release.artists[0].name
        } - ${release.title} (${DISCOGS_RELEASE_URL}${release.id})`
      );
    });
  }

  private logDiscographyAsIdList() {
    const idList = this.validatedReleases
      .map((release) => release.id)
      .join(",");

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
