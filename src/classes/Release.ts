import { fetchVersions } from "../api";
import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logWarning } from "../log";
import { DCRelease, DCVersion, DCVersions, RejectReason } from "../types";
import { Band } from "./Band";

export class Release {
  // The discogs release object
  private release: DCRelease;

  // The main band of the program
  private mainBand: Band;

  constructor(release: DCRelease, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
  }

  get id() {
    return this.masterId ?? this.release.id;
  }

  get masterId() {
    return this.release.master_id;
  }

  get artists() {
    return this.release.artists.map((artist) => artist.name).join(", ");
  }

  get extraArtists() {
    return this.release.extraartists ?? [];
  }

  get title() {
    return this.release.title;
  }

  get date() {
    return this.release.released ?? "unknown date";
  }

  get url() {
    return this.release.uri;
  }

  get label() {
    return `${this.date} - ${this.artists} - "${this.title}"\n(${this.url})"`;
  }

  get formats() {
    return this.release.formats.reduce(
      (allFormats: string[], format) => [
        ...allFormats,
        format.name,
        ...format.descriptions,
      ],
      []
    );
  }

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    return (
      this.heuristicRejectArtist() ??
      (await this.heuristicRejectFormat()) ??
      (await this.heuristicRejectWrittenByOnly()) ??
      this
    );
  }

  // Reject if the release is not by the main band, one of its members, or one
  // of its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this.release)) {
      return `rejected artist(s): ${this.artists}`;
    }

    return null;
  }

  // Reject if the release have an invalid format
  private async heuristicRejectFormat(): Promise<RejectReason | null> {
    if (!this.isValidFormatList(this.formats)) {
      if (this.masterId && !this.formats.includes("Single")) {
        logWarning(
          `Invalid main release format (${this.printFormats(this.formats)})`
        );

        if (await this.hasValidVersion()) return null;
      }

      return `rejected format(s): ${this.printFormats(this.formats)}`;
    }

    return null;
  }

  // Transform a format list to a printable string
  private printFormats(formats: string[]) {
    return formats.join(", ") ?? "not specified";
  }

  // Is this list of formats considered valid for the discogaphy?
  private isValidFormatList(formats: string[]): boolean {
    return (
      !!formats.find((format) => FORMATS.accept.includes(format)) &&
      !formats.find((format) => FORMATS.reject.includes(format))
    );
  }

  // Does one of the version has a valid format list?
  private async hasValidVersion(): Promise<boolean> {
    if (!this.masterId) return false;

    const versions = await fetchVersions(this.masterId);

    log(`🗃️ Looking into ${versions.pagination.items} version(s)`);

    for (const version of versions.versions) {
      if (await this.isValidVersion(version)) {
        return true;
      }
    }

    return false;
  }

  // Is the format list valid for this version?
  private async isValidVersion(version: DCVersion): Promise<boolean> {
    log(
      `🗃️ Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
    );

    const formats = [...version.major_formats, ...version.format.split(", ")];
    log(`Format: ${this.printFormats(formats)}`);

    if (this.isValidFormatList(formats)) {
      // this.release = fetchRelease(version.id);

      return true;
    }

    return false;
  }

  // Reject if the artist or connected artist role is only writing
  private async heuristicRejectWrittenByOnly(): RejectReason | null {
    const roles = this.extraArtists.filter(
      (artist) =>
        this.mainBand.members.find((member) => member.id === artist.id)
      // ||
      // this.artist.aliases?.map((alias) => alias.id).includes(artist.id),
    );

    // if (roles === "Written-By") {
    //   return "Written-By only";
    // }

    return null;
  }

  private async getRolesAsExtraArtist(): Promise<string> {
    this.roles = release.extraartists
      ? this.extraArtistToRoles(release.extraartists)
      : "";

    // If roles were not found, it might be because we're not looking at the
    // "correct" main release. Let's look at the one that was originally
    // referenced in the artistRelease object
    if (
      !this.roles &&
      this.artistRelease.type === "master" &&
      this.artistRelease.main_release &&
      (await this.master)?.main_release !== this.artistRelease.main_release
    ) {
      logInfo(
        `Roles were not found on release ${release.id}, looking at alternative release ${this.artistRelease.main_release}`
      );

      const artistReleaseMainRelease = await fetchRelease(
        this.artistRelease.main_release
      );

      this.roles = artistReleaseMainRelease.extraartists
        ? this.extraArtistToRoles(artistReleaseMainRelease.extraartists)
        : "";
    }

    return this.roles;
  }

  /**
   * Transform a list of extra artists to a list of role matching the release
   * artist
   */
  private extraArtistToRoles(extraArtists: ExtraArtist[]): string {
    return (
      extraArtists
        .filter(
          (artist) =>
            artist.id === this.artist.id ||
            this.artist.aliases?.map((alias) => alias.id).includes(artist.id)
        )
        .map((role) => role.role) ?? []
    ).join(", ");
  }
}
