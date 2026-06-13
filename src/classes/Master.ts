import { fetchRelease } from "../api";
import { DCMaster, RejectReason } from "../types";
import { Band } from "./Band";
import { Release } from "./Release";

/**
 * A master, which represent a group of similar releases
 */
export class Master {
  // The discogs master object
  private master: DCMaster;

  // The main band of the program
  private mainBand: Band;

  constructor(master: DCMaster, mainBand: Band) {
    this.master = master;
    this.mainBand = mainBand;
  }

  get artists() {
    return this.master.artists.map((artist) => artist.name).join(", ");
  }

  get mainRelease() {
    return this.master.main_release;
  }

  // Return main release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject = this.heuristicRejectArtist();

    if (reject) return reject;

    // If the master is valid, we now can look into the main release
    const release = new Release(
      await fetchRelease(this.mainRelease),
      this.mainBand
    );

    return release.getAcceptedRelease();
  }

  // Reject if the master is not by the main band, one of its members, or one of
  // its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this.master)) {
      return `Rejected artist(s): ${this.artists}`;
    }

    return null;
  }
}
