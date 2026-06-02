import { DCMaster, RejectReason } from "../types";
import { Release } from "./Release";

/**
 * A master, which represent a group of similar releases
 */
export class Master {
  // The discogs master object
  private master: DCMaster;

  constructor(master: DCMaster) {
    this.master = master;
  }

  get artists() {
    return this.master.artists;
  }

  // Return main release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    const reject = this.heuristicRejectArtist();
  }

  /* Reject if the master is not by the main band, one of its members, or one of
  its members other bands */
  private heuristicRejectArtist(): RejectReason | null {
    if (
      !this.artists.find((artist) => artist.id === this.artist.id) &&
      !this.artist.groups?.find((group) =>
        this.artists.find((artist) => group.id === artist.id)
      )
    ) {
      return `(rejected artist: ${this.artists
        .map((artist) => artist.name)
        .join(", ")})`;
    }

    return null;
  }
}
