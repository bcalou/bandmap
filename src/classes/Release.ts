import { DCRelease, RejectReason } from "../types";
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
    return this.release.master_id ?? this.release.id;
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
    return this.release.resource_url;
  }

  get label() {
    return `${this.date} - ${this.artists} - "${this.title}" (${this.url})"`;
  }

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    return (
      this.heuristicRejectArtist() ??
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

  // Reject if the artist or connected artist role is only writing
  private async heuristicRejectWrittenByOnly(): RejectReason | null {
    const roles =
      this.extraArtists
        .filter(
          (artist) => artist.id === this.mainBand.id,
          // ||
          // this.artist.aliases?.map((alias) => alias.id).includes(artist.id),
        )
        .map((role) => role.role) ?? [];

    console.log({ roles });

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
        `Roles were not found on release ${release.id}, looking at alternative release ${this.artistRelease.main_release}`,
      );

      const artistReleaseMainRelease = await fetchRelease(
        this.artistRelease.main_release,
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
            this.artist.aliases?.map((alias) => alias.id).includes(artist.id),
        )
        .map((role) => role.role) ?? []
    ).join(", ");
  }
}
