import { RejectReason } from "../types";
import { Artist } from "./Artist";
import { Release } from "./Release";

/**
 * The credits associated to a release
 * This is a list of the artists connected to the main band and the roles they
 * occupied on the associated release
 */
export class Credits {
  // The release associated to the credits list
  private release: Release;

  // The artist associated to this release and their roles
  private credits: {
    artist: Artist;
    roles: string[];
  }[] = [];

  constructor(release: Release) {
    this.release = release;
  }

  get formattedCredits() {
    return this.credits
      .map(
        (credit) =>
          `\x1b[1m${credit.artist.name}\x1b[0m: ${credit.roles.join(", ")}`
      )
      .join("\n");
  }

  // Reject if the artist if the associate role is only writing
  public async heuristicRejectNoCredits(): Promise<RejectReason | null> {
    this.credits = this.extractCredits();

    if (this.release.mainBand.isByOneOfBandMembers(this)) return null;

    if (this.credits.length === 0) {
      logWarning("No valid credits found");

      for (const version of (await this.getVersionsList()).versions) {
        if (await this.versionHasValidCredits(version)) return null;
      }

      return "Band release with no credits other than writing";
    }

    return null;
  }

  // Extract the credits from the extra artists list
  private extractCredits(): Credit[] {
    return [...this.extraArtists, ...this.getTracklistCredits()]
      .filter(this.mainBand.isExtraArtistConnectedToBand.bind(this.mainBand))
      .reduce(this.appendExtraArtistToCredits.bind(this), [])
      .map((credit) => ({
        ...credit,
        roles: Array.from(new Set(credit.roles)),
      }))
      .filter(this.isValidCredit.bind(this))
      .sort((c1, c2) => c1.artist.name.localeCompare(c2.artist.name));
  }

  // Does the release associate to this version have a valid credit?
  private async versionHasValidCredits(version: DCVersion): Promise<boolean> {
    if (version.id === this.id) return false;

    const versionRelease = await this.getVersion(version.id);

    this.credits = versionRelease.extractCredits();

    return this.credits.length > 0;
  }

  // Is the credit of type written / composed?
  private creditIsWrittenOnly(credit: Credit): boolean {
    return credit.roles.every((role) =>
      ["Written-By", "Composed By"].includes(role)
    );
  }

  // Return true if the credit is other that writing type, or the release is by
  // a band member
  private isValidCredit(credit: Credit): boolean {
    return (
      this.mainBand.isByOneOfBandMembers(this) ||
      !this.creditIsWrittenOnly(credit)
    );
  }

  // Get the extra artist credits from the tracklist
  private getTracklistCredits(): DCExtraArtist[] {
    return this.tracklist
      .flatMap((track) => track.extraartists ?? [])
      .filter((trackCredits) => trackCredits !== undefined);
  }

  // Append the extra artist infos to the credits list
  private appendExtraArtistToCredits(
    credits: Credit[],
    extraArtist: DCExtraArtist
  ): Credit[] {
    const member = this.mainBand.members.find((member) =>
      member.matchesId(extraArtist.id)
    );

    let credit = credits.find((credit) => member?.matchesId(credit.artist.id));

    if (member && !credit) {
      credit = { artist: member, roles: [] };
      credits.push(credit);
    }

    credit?.roles.push(...extraArtist.role.split(", "));

    return credits;
  }
}
