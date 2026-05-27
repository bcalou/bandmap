import { fetchMaster, fetchRelease, fetchVersions } from "../api";
import { ARTIST_RELEASE_ROLES, DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logError, logSuccess, logWarning } from "../log";
import { Artist, ArtistRelease, Master, Release } from "../types";

export class ReleaseManager {
  private artistRelease: ArtistRelease;
  private artist: Artist;
  private release: Promise<Release> | undefined;
  private master: Promise<Master> | undefined;

  /**
   * Get the release date, depending on available data
   */
  static getReleaseDate(release: Release): string {
    return release.released ?? release.year.toString();
  }

  constructor(artistRelease: ArtistRelease, artist: Artist) {
    this.artistRelease = artistRelease;
    this.artist = artist;
  }

  /**
   * Return the release
   */
  public async getRelease(): Promise<Release | undefined> {
    return this.release;
  }

  /**
   * Return the release if it should be selected for the artist discography,
   * null otherwise
   */
  public async getValidatedRelease(): Promise<Release | null> {
    if (this.heuristicRejectArtistReleaseRole()) return null;

    // We have to use the master to get the actual main release ID, as the data
    // is not always correct (it seems) on the artist release object
    if (this.artistRelease.type === "master") {
      this.master = fetchMaster(this.artistRelease.id);

      if (await this.heuristicRejectArtist(await this.master)) return null;

      this.release = fetchRelease((await this.master).main_release);
    } else {
      this.release = fetchRelease(this.artistRelease.id);

      if (await this.heuristicRejectArtist(await this.release)) return null;
    }

    if (await this.heuristicRejectWrittenByOnly()) return null;
    if (await this.heuristicRejectFormat()) return null;

    const release = await this.release;
    if (!release) throw Error("Release not found");

    const roles = await this.getRolesAsExtraArtist();
    logSuccess(roles);
    logSuccess(
      `✓ "${release.artists.map((artist) => artist.name).join(", ")} - ${
        release.title
      }"`,
    );

    return release;
  }

  /**
   * Return true if the role listed on the artist release is rejected
   */
  public heuristicRejectArtistReleaseRole(): boolean {
    if (ARTIST_RELEASE_ROLES.reject.includes(this.artistRelease.role)) {
      logWarning(
        `❌ "${this.artistRelease.artist} - ${this.artistRelease.title}" (role: ${this.artistRelease.role})`,
      );
      return true;
    }

    return false;
  }

  /**
   * Return false if the album is not by the artist or one of his groups
   */
  private async heuristicRejectArtist(release: Release | Master) {
    if (!release) throw new Error("Release not found");

    if (
      !release.artists.find((artist) => artist.id === this.artist.id) &&
      !this.artist.groups?.find((group) =>
        release.artists.find((artist) => group.id === artist.id),
      )
    ) {
      logWarning(
        `❌ ${this.artistRelease.artist} - "${
          release.title
        }" (artist: ${release.artists.map((artist) => artist.name).join(", ")})`,
      );

      return true;
    }

    return false;
  }

  /**
   * Return true if the artist is only credited as a writer
   * This aims to exclude live where the artist didn't actually play
   */
  private async heuristicRejectWrittenByOnly(): Promise<boolean> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    const roles = await this.getRolesAsExtraArtist();

    if (roles === "Written-By") {
      logError(
        `❌ ${this.artistRelease.artist} - "${release.title} (Written-By only)`,
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

    const formats = await this.getFormats();

    if (!this.isValidFormatList(formats)) {
      if (release.master_id && !formats.includes("Single")) {
        logWarning(
          `Invalid main release format (${
            formats.length ? formats.join(", ") : "not specified"
          }), looking into versions`,
        );

        return await this.hasValidVersion(release);
      }

      logWarning(
        `❌ "${this.artistRelease.artist} - ${release.title}" (format: ${
          formats.length ? formats.join(", ") : "not specified"
        })`,
      );
      return true;
    }

    return false;
  }

  /**
   * Return an array of string containing all the formats for the release
   */
  private async getFormats(): Promise<string[]> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    return release.formats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...format.descriptions,
      ],
      [],
    );
  }

  /**
   * Return true if a list of formats is considered valid
   */
  private isValidFormatList(formats: string[]): boolean {
    return (
      !!formats.find((format) => FORMATS.accept.includes(format)) &&
      !formats.find((format) => FORMATS.reject.includes(format))
    );
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
          `Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`,
        );
        const formats = [
          ...version.major_formats,
          ...version.format.split(", "),
        ];
        log(`Format: ${formats.length ? formats.join(", ") : "not specified"}`);

        if (this.isValidFormatList(formats)) {
          this.release = fetchRelease(version.id);

          return true;
        }

        return false;
      })
    ) {
      logWarning(
        `❌ ${this.artistRelease.artist} - "${release.title}" (no version with valid format found)`,
      );
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get a string array of the roles occupied by the artist as an extra artist
   * for this release
   */
  private async getRolesAsExtraArtist(): Promise<string> {
    const release = await this.release;
    if (!release) throw new Error("Release not found");

    return (
      release.extraartists
        ?.filter(
          (extraArtist) =>
            extraArtist.id === this.artist.id ||
            this.artist.aliases
              ?.map((alias) => alias.id)
              .includes(extraArtist.id),
        )
        .map((role) => role.role) ?? []
    ).join(", ");
  }
}
