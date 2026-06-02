import { ARTIST_RELEASE_ROLES } from "../../src_old/env";
import { fetchMaster, fetchRelease } from "../api";
import { log, logError, logWarning } from "../log";
import { DCArtistRelease, RejectReason } from "../types";
import { Discography } from "./Discography";
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

  // The discography that the app is computing
  private discography: Discography;

  constructor(artistRelease: DCArtistRelease, discography: Discography) {
    this.artistRelease = artistRelease;
    this.discography = discography;
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

  get label() {
    return `${this.year} - ${this.artist} - "${this.title}"`;
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

    if (typeof release === "object") {
      this.discography.addAccepted(release);
    } else {
      this.discography.addRejected(this, release);
    }
  }

  // Return the matching release object if it's considered acceptable
  private async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject = this.heuristicRejectRole();

    if (reject) return reject;

    const release =
      this.type === "master"
        ? new Master(await fetchMaster(this.id))
        : new Release(await fetchRelease(this.id));

    return release.getAcceptedRelease();
  }

  // Return true if the artistRelease is already in the discography
  private isIncludedInDiscography(): boolean {
    const inclusionState = this.discography.includes(this.id);

    if (inclusionState) {
      logWarning(`↷ "${this.label}" (skipping, already ${inclusionState})`);

      return true;
    }

    return false;
  }

  // Reject artist releases with an invalid role
  public heuristicRejectRole(): RejectReason | null {
    if (ARTIST_RELEASE_ROLES.reject.includes(this.artistRelease.role)) {
      return `rejected release role: ${this.artistRelease.role}`;
    }

    return null;
  }
}
