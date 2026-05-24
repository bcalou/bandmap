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
    if (this.heuristicRejectArtistVariousArtists()) return null;
    if (this.heuristicRejectArtistReleaseRole()) return null;

    this.release = fetchRelease(this.mainReleaseId);

    const release = await this.release;
    if (!release) throw Error("Release not found");

    if (await this.heuristicRejectArtistRole()) return null;
    if (await this.heuristicRejectFormat()) return null;

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
   * Return true if the artist of the release is "Various"
   */
  private heuristicRejectArtistVariousArtists(): boolean {
    if (this.artistRelease.artist === "Various") {
      logWarning(`❌ "${this.artistRelease.title}" (various artists)`);
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

    const formats = await this.getFormats();

    if (!this.hasValidFormat(formats)) {
      if (
        release.master_id &&
        !formats.find((format) => format.includes("Single"))
      ) {
        logWarning(
          `Invalid main release format (${
            formats.length ? formats.join(", ") : "not specified"
          }), looking into versions`
        );

        return await this.hasValidVersion(release);
      }

      logWarning(
        `❌ "${release.title}" (format: ${
          formats.length ? formats.join(", ") : "not specified"
        })`
      );
      return true;
    }

    return false;
  }

  /**
   * Return an array of strings for each format
   * (combine the format name and description)
   */
  private async getFormats(): Promise<string[][]> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    return release.formats.map((format) => [
      format.name,
      ...format.descriptions,
    ]);
  }

  /**
   * Return true if a list of formats is considered valid
   */
  private hasValidFormat(formats: string[][]): boolean {
    return !!formats.find((format) => {
      !!format.find((_format) => FORMATS.accept.includes(_format)) &&
        !format.find((_format) => FORMATS.reject.includes(_format));
    });
  }

  /**
   * Return true if one of the versions has a valid format
   */
  private async hasValidVersion(release: Release): Promise<boolean> {
    if (!release.master_id) return false;
    const versions = await fetchVersions(release.master_id);
    log(`Fetched ${versions.pagination.items} version(s)`);

    if (
      !versions.versions.find((version) => {
        log(
          `Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
        );
        const formats = [
          ...version.major_formats,
          ...version.format.split(", "),
        ];
        log(`Format: ${formats.length ? formats.join(", ") : "not specified"}`);

        return this.hasValidFormat([formats]);
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

    if (!release.artists.find((artist) => artist.id === this.artist.id)) {
      const rolesAsExtraArtist = await this.getRolesAsExtraArtist();

      if (
        rolesAsExtraArtist?.every((role) =>
          EXTRA_ARTIST_ROLES.reject.includes(role)
        )
      ) {
        logWarning(
          `❌ "${release.title}" (extra artist roles: ${
            rolesAsExtraArtist.length
              ? rolesAsExtraArtist.join(", ")
              : "not specified"
          })`
        );
        return true;
      }

      return false;
    }
    return false;
  }

  /**
   * Get a list of the role occupied as an extra artist on this release
   */
  private async getRolesAsExtraArtist(): Promise<string[]> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    return (
      release.extraartists
        ?.filter((extraArtist) => extraArtist.id === this.artist.id)
        .map((role) => role.role) ?? []
    );
  }
}
