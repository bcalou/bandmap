import {
  ARTIST_RELEASE_ROLES,
  DISCOGS_MASTER_URL,
  DISCOGS_RELEASE_URL,
} from "../env";
import { Api } from "./Api";
import { logSeparator, logWarning } from "../log";
import { DCArtistRelease, RejectReason } from "../types";
import { Band } from "./Band";
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

  constructor(artistRelease: DCArtistRelease, mainBand: Band) {
    this.artistRelease = artistRelease;
    this.mainBand = mainBand;
    this.api = new Api();
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

  // Analyze the release and add it to the discography as accepted or rejected
  public async addToDiscography() {
    if (this.isIncludedInDiscography()) return null;

    const release = await this.getAcceptedRelease();

    if (typeof release === "string") {
      this.mainBand.discography.addRejected(this, release);
    } else {
      this.mainBand.discography.addAccepted(release);
    }
  }

  // Return the matching release object if it's considered acceptable
  private async getAcceptedRelease(): Promise<Release | RejectReason> {
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
      return release.getAcceptedRelease();
    } catch (err) {
      return `Error while fetching release: ${err}`;
    }
  }

  // Return true if the artistRelease is already in the discography
  private isIncludedInDiscography(): boolean {
    const inclusionState = this.mainBand.discography.includes(this.id);

    if (inclusionState) {
      logWarning(`↷ "${this.label}" (skipping, already ${inclusionState})`);
      logSeparator();

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
    if (this.title.indexOf(" = ") > -1) {
      return "Alternate language release";
    }

    return null;
  }
}
