import { ExtraArtist } from "../../src_old/types";
import { fetchRelease, fetchVersions } from "../api";
import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log, logWarning } from "../log";
import {
  Credit,
  DCExtraArtist,
  DCRelease,
  DCVersion,
  RejectReason,
} from "../types";
import { Band } from "./Band";

export class Release {
  // The discogs release object
  private release: DCRelease;

  // The main band of the program
  private mainBand: Band;

  // The artist associated to this release
  private credits: Credit[] = [];

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
    return this.release.artists;
  }

  get formattedArtists() {
    return this.artists.map((artist) => artist.name).join(", ");
  }

  get extraArtists() {
    return this.release.extraartists ?? [];
  }

  get formattedCredits() {
    return this.credits
      .map(
        (credit) =>
          `\x1b[1m${credit.artist.name}\x1b[0m: ${credit.roles.join(", ")}`
      )
      .join("\n");
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
    return `${this.date} - ${this.formattedArtists} - "${this.title}"\n(${this.url})`;
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

  get tracklist() {
    return this.release.tracklist;
  }

  // Extract the credits from the extra artists list
  public extractCredits(): Credit[] {
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

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject =
      this.heuristicRejectArtist() ??
      (await this.heuristicRejectFormat()) ??
      (await this.heuristicRejectNoCredits());

    if (reject) return reject;

    return this;
  }

  // Reject if the release is not by the main band, one of its members, or one
  // of its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this.release)) {
      return `Rejected artist(s): ${this.formattedArtists}`;
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

        if (await this.hasVersionWithValidFormat()) return null;
      }

      return `Rejected format(s): ${this.printFormats(this.formats)}`;
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
  private async hasVersionWithValidFormat(): Promise<boolean> {
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
    if (version.id === this.id) return false;

    log(
      `🗃️ Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
    );

    const formats = [...version.major_formats, ...version.format.split(", ")];
    log(`Format: ${this.printFormats(formats)}`);

    return this.isValidFormatList(formats);
  }

  // Reject if the artist if the associate role is only writing
  private async heuristicRejectNoCredits(): Promise<RejectReason | null> {
    this.credits = this.extractCredits();

    if (this.mainBand.isByOneOfBandMembers(this.release)) return null;

    if (this.credits.length === 0) {
      logWarning("No valid credits found");

      if (await this.hasVersionWithValidCredits()) return null;

      return "Band release with no credits other than writing";
    }

    return null;
  }

  // Does one of the version has a valid format list?
  private async hasVersionWithValidCredits(): Promise<boolean> {
    if (!this.masterId) return false;

    const versions = await fetchVersions(this.masterId);

    log(`🗃️ Looking into ${versions.pagination.items} version(s)`);

    for (const version of versions.versions) {
      if (await this.versionHasValidCredits(version)) return true;
    }

    return false;
  }

  // Does the release associate to this version have a valid credit?
  private async versionHasValidCredits(version: DCVersion): Promise<boolean> {
    if (version.id === this.id) return false;

    log(
      `🗃️ Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
    );

    const versionRelease = new Release(
      await fetchRelease(version.id),
      this.mainBand
    );

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
      this.mainBand.isByOneOfBandMembers(this.release) ||
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
    extraArtist: ExtraArtist
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
