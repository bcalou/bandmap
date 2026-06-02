import { DCRelease, RejectReason } from "../types";

export class Release {
  private release: DCRelease;

  constructor(release: DCRelease) {
    this.release = release;
  }

  get id() {
    return this.release.master_id ?? this.release.id;
  }

  get artist() {
    return this.release.artists.join(", ");
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
    return "null";
  }
}
