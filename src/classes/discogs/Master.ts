import { RULES } from "../../rules";
import { DCMaster, RejectReason } from "../../types";
import { Api } from "../common/Api";
import { Band } from "./Band";
import { Release } from "./release/Release";

/**
 * A master, which represent a group of similar releases
 */
export class Master {
  // The discogs master object
  private master: DCMaster;

  // The main band of the program
  private mainBand: Band;

  // The api object
  private api: Api;

  constructor(master: DCMaster, mainBand: Band) {
    this.master = master;
    this.mainBand = mainBand;
    this.api = new Api();
  }

  get artists() {
    return this.master.artists;
  }

  get formattedArtists() {
    return this.artists.map((artist) => artist.name).join(", ");
  }

  get mainRelease() {
    return this.master.main_release;
  }

  get genres() {
    return this.master.genres ?? [];
  }

  // Return main release object if it's considered acceptable
  public async getCandidateRelease(): Promise<Release | RejectReason> {
    const reject = this.heuristicRejectArtist() ?? this.heuristicRejectGenre();

    if (reject) return reject;

    // If the master is valid, we now can look into the main release
    const release = new Release(
      await this.api.getRelease(this.mainRelease),
      this.mainBand
    );

    return release.getCandidateRelease();
  }

  // Reject if the master is not by the main band, one of its members, or one of
  // its member's other bands
  private heuristicRejectArtist(): RejectReason | null {
    if (!this.mainBand.isAuthorOrConnectedAuthor(this)) {
      return `Rejected artist(s): ${this.formattedArtists}`;
    }

    return null;
  }

  // Reject if the master contains non-music
  private heuristicRejectGenre(): RejectReason | null {
    if (!!this.genres.find((genre) => RULES.genres.reject.includes(genre))) {
      return `Rejected genre(s): ${this.master.genres}`;
    }

    return null;
  }
}
