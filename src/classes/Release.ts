import { fetchRelease, fetchVersions } from "../api";
import {
  ARTIST_RELEASE_ROLES,
  DISCOGS_RELEASE_URL,
  EXTRA_ARTIST_ROLES,
  FORMATS,
} from "../env";
import { log, logSeparator, logSuccess, logWarning } from "../log";
import { Artist, ArtistRelease, Release } from "../types";

export class ReleaseManager {
  private artistRelease: ArtistRelease;
  private artist: Artist;
  private mainReleaseId: number;
  private release: Promise<Release> | undefined;

  /**
   * Get the release date, depending on available data
   */
  static getReleaseDate(release: Release): string {
    return release.released ?? release.year.toString();
  }

  constructor(artistRelease: ArtistRelease, artist: Artist) {
    this.artistRelease = artistRelease;
    this.artist = artist;
    this.mainReleaseId = artistRelease.main_release ?? artistRelease.id;
  }

  /**
   * Return the release if it should be selected for the artist discography,
   * null otherwise
   */
  public async getValidatedRelease(): Promise<Release | null> {
    logSeparator();
    const url = `${DISCOGS_RELEASE_URL}${this.mainReleaseId}`;
    log(`Analyzing artist release ${this.artistRelease.id} (${url})`);

    if (this.heuristicRejectArtistReleaseRole()) return null;

    this.release = fetchRelease(this.mainReleaseId);

    const release = await this.release;
    if (!release) throw Error("Release not found");

    if (await this.heuristicRejectArtistRole()) return null;
    if (await this.heuristicRejectFormat()) return null;

    // const formats = await this.getReleaseFormats();

    // if (!VersionsManager.acceptFormats(formats)) {
    // if (release.master_id) {
    //   const versionsManager = new VersionsManager(release.master_id);

    //   if (!(await versionsManager.hasValidVersion())) {
    //     logWarning(
    //       `❌ "${release.title}" (no version found with valid formats)`
    //     );
    //     return null;
    //   }
    // } else {
    // logWarning(
    //   `❌ "${release.title}" (formats: ${
    //     formats.length > 0 ? formats.join(", ") : "not specified"
    //   })`,
    // );
    // return null;
    // }
    // }

    // if (release.artists.length > 1) {
    //   logWarning(
    //     `❌ "${release.title}" (multiple artists: ${release.artists
    //       .map((artist) => artist.name)
    //       .join(", ")})`,
    //   );
    //   return null;
    // }

    // if (!(await this.isMainArtist())) {
    //   const roles = await this.getRolesAsExtraArtist();

    //   if (roles.find((role) => EXTRA_ARTIST_ROLES.reject.includes(role))) {
    //     logWarning(
    //       `❌ "${release.title}" (role(s): ${
    //         roles.length ? roles.join(", ") : "not specified"
    //       })`,
    //     );
    //     return null;
    //   } else {
    //     log(`Not the main artist, role(s): ${roles.join(", ")}`);
    //   }
    // }

    logSuccess(`✓ "${release.title}"`);

    return release;
  }

  /**
   * Return true if the role listed on the artist release is rejected
   */
  public heuristicRejectArtistReleaseRole(): boolean {
    if (ARTIST_RELEASE_ROLES.reject.includes(this.artistRelease.role)) {
      logWarning(
        `❌ "${this.artistRelease.title}" (role: ${this.artistRelease.role})`
      );
      return true;
    }

    return false;
  }

  /**
   * Return true if the format of the release is rejected
   */
  private async heuristicRejectFormat(): Promise<boolean> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    const formats = release.formats.reduce(
      (allFormats: string[], format) => [...allFormats, ...format.descriptions],
      []
    );

    if (
      !formats.find((format) => FORMATS.accept.includes(format)) ||
      formats.find((format) => FORMATS.reject.includes(format))
    ) {
      if (release.master_id) {
        return await this.hasValidVersion(release);
      }

      logWarning(
        `❌ "${release.title}" (rejected format: ${
          formats.length ? formats.join(", ") : "not specified"
        })`
      );
      return true;
    }

    return false;
  }

  /**
   * Return true if one of the versions has a valid format
   */
  private async hasValidVersion(release: Release): Promise<boolean> {
    if (!release.master_id) return false;
    const versions = await fetchVersions(release.master_id);

    logWarning(
      `Invalid main release format, looking into ${versions.pagination.items} versions`
    );

    if (
      !versions.versions.find((version) => {
        log(
          `Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
        );
        log(`Format: ${version.format || "not specified"}`);

        return (
          version.format
            .split(", ")
            .find((format) => FORMATS.accept.includes(format)) &&
          !version.format
            .split(", ")
            .find((format) => FORMATS.reject.includes(format))
        );
      })
    ) {
      logWarning(`❌ "${release.title}" (no version with valid format found)`);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Return true if the album artist is not the only main artist
   */
  private async heuristicRejectArtistRole() {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    if (this.artistRelease.artist !== this.artist.name) {
      const rolesAsExtraArtist =
        release.extraartists
          ?.filter((extraArtist) => extraArtist.id === this.artist.id)
          .map((role) => role.role) ?? [];

      if (
        rolesAsExtraArtist?.every((role) =>
          EXTRA_ARTIST_ROLES.reject.includes(role)
        )
      ) {
        logWarning(
          `❌ "${release.title}" (extra artist roles: ${rolesAsExtraArtist})`
        );
      }

      return true;
    }
    return false;
  }

  /**
   * Get a string array of the roles occupied by the artist as an extra artist
   * for this release
   */
  // private async getRolesAsExtraArtist(): Promise<string[]> {
  //   const release = await this.release;

  //   return (
  //     release.extraartists
  //       ?.filter((extraArtist) => extraArtist.id === this.artistId)
  //       .map((role) => role.role) ?? []
  //   );
  // }
}
