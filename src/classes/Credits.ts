import { ROLES } from "../env";
import { DCExtraArtist, DCVersion, RejectReason } from "../types";
import { Artist } from "./Artist";
import { Band } from "./Band";
import { Logger } from "./Logger";
import { Release } from "./Release";

type Credit = {
  artist: Artist;
  roles: string[];
};

/**
 * The credits associated to a release
 * This is a list of the artists connected to the main band and the roles they
 * occupied on the associated release
 */
export class Credits {
  // The release associated to the credits list
  private release: Release;

  // The main band of the program
  private mainBand: Band;

  // The artist associated to this release and their roles
  private credits: Credit[] = [];

  // The logger object
  private logger: Logger;

  constructor(release: Release, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
    this.logger = new Logger();
  }

  get formattedCredits() {
    return this.credits
      .map((credit) => `${credit.artist.name}: ${credit.roles.join(", ")}`)
      .join("\n");
  }

  // Reject if the artist if the associate role is only writing, interviewee...
  public async heuristicRejectNoCredits(): Promise<RejectReason | null> {
    this.credits = this.extractCredits();

    if (this.mainBand.isByOneOfBandMembers(this.release)) return null;

    if (this.credits.length === 0) {
      this.logger.logWarning(
        `No valid credit found for "${this.release.title}"`,
      );

      return this.lookForCreditsInOtherVersions();
    }

    return null;
  }

  // Extract the credits from the extra artists list
  public extractCredits(): Credit[] {
    return [...this.release.extraArtists, ...this.getTracklistCredits()]
      .filter(this.mainBand.isExtraArtistConnectedToBand.bind(this.mainBand))
      .reduce(this.appendExtraArtistToCredits.bind(this), [])
      .map((credit) => ({
        ...credit,
        roles: Array.from(new Set(credit.roles)),
      }))
      .filter(this.isValidCredit.bind(this))
      .sort((c1, c2) => c1.artist.name.localeCompare(c2.artist.name));
  }

  // Look for valid credits in other versions of the release
  private async lookForCreditsInOtherVersions(
    page = 1,
  ): Promise<RejectReason | null> {
    const versions = await this.release.getVersions(page);

    for (const version of versions.versions) {
      if (await this.versionHasValidCredits(version)) {
        this.logger.log(`Found credits`);

        return null;
      }
    }

    this.logger.log(versions.pagination.pages.toString())

    if (versions.pagination.pages > page)
      return await this.lookForCreditsInOtherVersions(page + 1);

    return "Band release with no credits other than writing";
  }

  // Does the release associate to this version have a valid credit?
  private async versionHasValidCredits(version: DCVersion): Promise<boolean> {
    const versionRelease = await this.release.getVersion(version.id);

    if (!versionRelease) return false;

    this.credits = versionRelease.extractCredits();

    return this.credits.length > 0;
  }

  // Is the credit of type written / composed?
  private creditIsWrittenOnly(credit: Credit): boolean {
    return credit.roles.every((role) => ROLES.rejectIfOnly.includes(role));
  }

  // Return true if the credit is other that writing type, or the release is by
  // a band member
  private isValidCredit(credit: Credit): boolean {
    return (
      this.mainBand.isByOneOfBandMembers(this.release) ||
      !this.creditIsWrittenOnly(credit)
    );
  }

  // Get the extra artist credits from the tracklist
  private getTracklistCredits(): DCExtraArtist[] {
    return this.release.tracklist
      .flatMap((track) => track.extraartists ?? [])
      .filter((trackCredits) => trackCredits !== undefined);
  }

  // Append the extra artist infos to the credits list
  private appendExtraArtistToCredits(
    credits: Credit[],
    extraArtist: DCExtraArtist,
  ): Credit[] {
    const member = this.mainBand.members.find((member) =>
      member.matchesId(extraArtist.id),
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
