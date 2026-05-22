import z from "zod";
import { fetchRelease } from "../api";
import { EXTRA_ARTIST_ROLES } from "../env";
import { log, logWarning } from "../log";
import { VersionsManager } from "./Versions";

export type Release = z.infer<typeof Release>;
export const Release = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
  formats: z.array(
    z.object({
      descriptions: z.array(z.string()),
    }),
  ),
  master_id: z.number().optional(),
  released: z.string().optional(),
  extraartists: z
    .array(z.object({ id: z.number(), role: z.string() }))
    .optional(),
});

export class ReleaseManager {
  private release: Promise<Release>;
  private artistId: number;

  /**
   * Get the release date, depending on available data
   */
  static getReleaseDate(release: Release): string {
    return release.released ?? release.year.toString();
  }

  constructor(id: number, artistId: number) {
    this.release = fetchRelease(id);
    this.artistId = artistId;
  }

  /**
   * Return the release if it should be selected for the artist discography,
   * null otherwise
   */
  public async getValidatedRelease(): Promise<Release | null> {
    const release = await this.release;
    const formats = await this.getReleaseFormats();

    if (!VersionsManager.acceptFormats(formats)) {
      if (release.master_id) {
        const versionsManager = new VersionsManager(release.master_id);

        if (!(await versionsManager.hasValidVersion())) {
          logWarning(
            `❌ "${release.title}" (no version found with valid formats)`,
          );
          return null;
        }
      } else {
        logWarning(
          `❌ "${release.title}" (formats: ${formats.length > 0 ? formats.join(", ") : "not specified"})`,
        );
        return null;
      }
    }

    if (!(await this.isMainArtist())) {
      const roles = await this.getRolesAsExtraArtist();

      if (!roles.find((role) => EXTRA_ARTIST_ROLES.accept.includes(role))) {
        logWarning(
          `❌ "${release.title}" (role(s): ${roles.length ? roles.join(", ") : "not specified"})`,
        );
        return null;
      } else {
        log(`Not the main artist, role(s): ${roles.join(", ")}`);
      }
    }

    return release;
  }

  /**
   * Get a string array of all the release formats
   */
  private async getReleaseFormats(): Promise<string[]> {
    const release = await this.release;

    return release.formats.reduce(
      (allFormats: string[], format) => [...allFormats, ...format.descriptions],
      [],
    );
  }

  /**
   * Return true if the artist is the main artist for the given release
   */
  private async isMainArtist(): Promise<boolean> {
    const release = await this.release;

    return !!release.artists.find((_artist) => _artist.id === this.artistId);
  }

  /**
   * Get a string array of the roles occupied by the artist as an extra artist
   * for this release
   */
  private async getRolesAsExtraArtist(): Promise<string[]> {
    const release = await this.release;

    return (
      release.extraartists
        ?.filter((extraArtist) => extraArtist.id === this.artistId)
        .map((role) => role.role) ?? []
    );
  }
}
