import { DCExtraArtist } from "../../../types";
import { Artist } from "../Artist";
import { Band } from "../Band";
import { getLogger, Logger } from "../../common/Logger";
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
  public release: Release;

  // The main band of the program
  private mainBand: Band;

  constructor(release: Release, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
  }

  get credits() {
    return [...this.release.extraArtists, ...this.getTracklistCredits()]
      .filter((artist) => this.mainBand.isArtistConnectedToBand(artist.id))
      .reduce(this.appendExtraArtistToCredits.bind(this), [])
      .map((credit) => ({
        ...credit,
        roles: Array.from(new Set(credit.roles)),
      }))
      .filter(this.isValidCredit.bind(this))
      .sort((c1, c2) => c1.artist.name.localeCompare(c2.artist.name));
  }

  get formattedCredits() {
    return this.credits
      .map((credit) => `🎤 ${credit.artist.name}: ${credit.roles.join(", ")}`)
      .join("\n");
  }

  // Reject if the artist if the associate role is only writing, interviewee...
  // public async heuristicRejectNoCredits(): Promise<RejectReason | null> {
  //   // this.credits = this.extractCredits();

  //   if (this.mainBand.isByOneOfBandMembers(this.release)) return null;

  //   if (this.credits.length === 0) {
  //     getLogger().logWarning(
  //       `No valid credit found for "${this.release.title}"`
  //     );

  //     return this.lookForCreditsInOtherVersions();
  //   }

  //   return null;
  // }

  // public hasValidCredits() {
  //   this.extractCredits();
  //   getLogger().log(this.formattedCredits);
  //   return !!this.formattedCredits;
  // }

  // Extract the credits from the extra artists list
  // public extractCredits() {
  //   [...this.release.extraArtists, ...this.getTracklistCredits()]
  //     .filter((artist) => this.mainBand.isArtistConnectedToBand(artist.id))
  //     .reduce(this.appendExtraArtistToCredits.bind(this), [])
  //     .map((credit) => ({
  //       ...credit,
  //       roles: Array.from(new Set(credit.roles)),
  //     }))
  //     .filter(this.isValidCredit.bind(this))
  //     .sort((c1, c2) => c1.artist.name.localeCompare(c2.artist.name));
  // }

  // Extract credits
  public async getReleaseWithCredits(): Promise<Release | null> {
    if (this.credits.length) return this.release;

    getLogger().logInfo(`🎤 Trying to find release with credits`);
    return await this.findVersionWithCredits(1);
  }

  // Find a release which has credits infos
  private async findVersionWithCredits(page: number): Promise<Release | null> {
    const versions = await this.release.getVersions({ page });

    for (const version of versions.versions) {
      const release = await this.release.getVersion(version.id);

      if (!release || !release.isValidVersion()) continue;

      if (release.credits.credits.length) {
        getLogger().log("Credits found");
        return release;
      }
    }

    if (versions.pagination.pages > page) {
      await this.findVersionWithCredits(page + 1);
    } else {
      getLogger().logWarning("No credits found");
      return null;
    }

    return null;
  }

  // Look for valid credits in other versions of the release
  // private async lookForCreditsInOtherVersions(
  //   page = 1
  // ): Promise<RejectReason | null> {
  //   const versions = await this.release.getVersions(page);

  //   for (const version of versions.versions) {
  //     if (await this.versionHasValidCredits(version)) {
  //       getLogger().log(`Found credits`);

  //       return null;
  //     }
  //   }

  //   if (versions.pagination.pages > page)
  //     return await this.lookForCreditsInOtherVersions(page + 1);

  //   return "Band release with no credits other than writing";
  // }

  // Does the release associate to this version have a valid credit?
  // private async versionHasValidCredits(version: DCVersion): Promise<boolean> {
  //   const versionRelease = await this.release.getVersion(version.id);

  //   if (!versionRelease) return false;

  //   this.credits = versionRelease.extractCredits();

  //   return this.credits.length > 0;
  // }

  // Is the credit of type written / composed?
  // private creditIsWrittenOnly(credit: Credit): boolean {
  //   return credit.roles.every((role) => ROLES.rejectIfOnly.includes(role));
  // }

  // Return true if the credit is other that writing type, or the release is by
  // a band member
  private isValidCredit(credit: Credit): boolean {
    return true;
    // return (
    //   this.mainBand.isByOneOfBandMembers(this.release) ||
    //   !this.creditIsWrittenOnly(credit)
    // );
  }

  // Get the extra artist credits from the tracklist
  private getTracklistCredits(): DCExtraArtist[] {
    return this.release.tracklist
      .getValidTracks()
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
