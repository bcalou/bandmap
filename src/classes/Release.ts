import { DCRelease, RejectReason } from "../types";
import { Band } from "./Band";

export class Release {
  // The discogs release object
  private release: DCRelease;

  // The main band of the program
  private mainBand: Band;

  constructor(release: DCRelease, mainBand: Band) {
    this.release = release;
    this.mainBand = mainBand;
  }

  get id() {
    return this.release.master_id ?? this.release.id;
  }

  get artist() {
    return this.release.artists.map((artist) => artist.name).join(", ");
  }

  get title() {
    return this.release.title;
  }

  get date() {
    return this.release.released ?? "unknown date";
  }

  get url() {
    return this.release.resource_url;
  }

  get label() {
    return `${this.date} - ${this.artist} - "${this.title}" (${this.url})"`;
  }

  // Return release object if it's considered acceptable
  public async getAcceptedRelease(): Promise<Release | RejectReason> {
    return this;
  }
}
