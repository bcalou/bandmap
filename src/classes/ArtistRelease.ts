import {
  ARTIST_RELEASE_ROLES,
  DISCOGS_MASTER_URL,
  DISCOGS_RELEASE_URL,
} from "../env";
import { DCArtistRelease, RejectReason } from "../types";
import { Api } from "./Api";
import { Band } from "./Band";
import { Logger } from "./Logger";
import { Master } from "./Master";
import { Release } from "./Release";

/**
 * An artist's release, which is an simplified representation of a release
 * It contains some interesting infos which can be used to determine if
 * the release need to be analyzed in more details or not
 */
export class ArtistRelease {
  // The discogs ArtistRelease object
  private artistRelease: DCArtistRelease;

  // The main band of the program
  private mainBand: Band;

  // The api object
  private api: Api;

  // The logger object
  private logger: Logger;

  constructor(artistRelease: DCArtistRelease, mainBand: Band) {
    this.artistRelease = artistRelease;
    this.mainBand = mainBand;
    this.api = new Api();
    this.logger = new Logger();
  }

  get id() {
    return this.artistRelease.id;
  }

  get artist() {
    return this.artistRelease.artist;
  }

  get title() {
    return this.artistRelease.title;
  }

  get year() {
    return this.artistRelease.year ?? "unknown date";
  }

  get role() {
    return this.artistRelease.role;
  }

  get label() {
    return `${this.year} - ${this.artist} - "${this.title}"\n(${this.url})`;
  }

  get url() {
    return this.type === "master"
      ? `${DISCOGS_MASTER_URL}${this.id}`
      : `${DISCOGS_RELEASE_URL}${this.id}`;
  }

  get type() {
    return this.artistRelease.type;
  }

  get mainRelease() {
    return this.artistRelease.main_release;
  }

  // Analyze the release and add it to the discography as candidate or rejected
  public async addToDiscography() {
    if (this.isIncludedInDiscography()) return null;

    const release = await this.getCandidateRelease();

    if (typeof release === "string") {
      this.mainBand.discography.addRejected(this, release);
    } else if (release.getMainFormat() === "Album") {
      await this.mainBand.discography.addAccepted(release);
    } else {
      this.mainBand.discography.addCandidate(release);
    }
  }

  // Return the matching release object if it's considered acceptable
  private async getCandidateRelease(): Promise<Release | RejectReason> {
    this.logger.log(`Analyzing release ${this.url}`);

    return (
      this.heuristicRejectRole() ??
      this.heuristicRejectAlternateLanguage() ??
      this.fetchRelease()
    );
  }

  // Fetch the master or release in order to accept/reject it
  private async fetchRelease(): Promise<Release | RejectReason> {
    try {
      const release =
        this.type === "master"
          ? new Master(await this.api.getMaster(this.id), this.mainBand)
          : new Release(await this.api.getRelease(this.id), this.mainBand);
      return release.getCandidateRelease();
    } catch (err) {
      return `Error while fetching release: ${err}`;
    }
  }

  // Return true if the artistRelease is already in the discography
  private isIncludedInDiscography(): boolean {
    const inclusionState = this.mainBand.discography.includes(this.id);

    if (inclusionState) {
      this.logger.logWarning(
        `↷ "${this.label}" (skipping, already ${inclusionState})`,
      );
      this.logger.logSeparator();

      return true;
    }

    return false;
  }

  // Reject artist releases with an invalid role
  private heuristicRejectRole(): RejectReason | null {
    if (ARTIST_RELEASE_ROLES.reject.includes(this.role)) {
      return `Rejected release role: ${this.role}`;
    }

    return null;
  }

  // Reject copies of a release with translate titles (noted with a = sign on
  // discogs)
  private heuristicRejectAlternateLanguage(): RejectReason | null {
    return this.title.indexOf(" = ") > -1 ? "Alternate language release" : null;
  }
}
