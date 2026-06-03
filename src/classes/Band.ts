import { fetchArtist } from "../api";
import { DISCOGS_ARTIST_URL } from "../env";
import { logInfo, logSeparator, logSuccess } from "../log";
import { DCArtist, DCGroup } from "../types";
import { clean } from "../utils";
import { Artist } from "./Artist";

/**
 * The main band which we're looking at
 */
export class Band {
  // The discogs artist object for this band
  private band: DCArtist;

  // The members of the band
  private members: Artist[] = [];

  // The other bands of the members of the main band
  private connectedBands: {
    // The discogs group object
    band: DCGroup;
    // The list of member from the main band
    members: Artist[];
  }[] = [];

  constructor(band: DCArtist) {
    this.band = band;
  }

  get id() {
    return this.band.id;
  }

  get name() {
    return this.band.name;
  }

  get url() {
    return this.band.uri;
  }

  get bandMembers() {
    return this.band.members ?? [];
  }

  // Fetch each of the band members and its connected bands infos
  public async fetchMembersAndConnectedBands(): Promise<void> {
    logSeparator();
    logInfo(`${this.bandMembers.length} member(s)`);

    for (const _member of this.bandMembers) {
      const member = new Artist(await fetchArtist(_member.id));

      this.members.push(member);
    }

    for (const member of this.members) {
      this.addConnectedBands(member);
    }

    this.orderConnectedBands();
    this.logConnectedBands();
  }

  // Fetch the bands connected to the main band members
  public fetchConnectedBands(): void {
    for (const member of this.members) {
      this.addConnectedBands(member);
    }

    this.orderConnectedBands();
    this.logConnectedBands();
  }

  // Add the member's band to the list of connected bands
  private addConnectedBands(member: Artist): void {
    member.bands?.forEach((band) => {
      if (!this.isInsideConnectedBands(band)) {
        this.connectedBands.push({
          band,
          members: this.getConnectedBandMembers(band),
        });
      }
    });
  }

  // Is the given band already included in the connected bands ?
  isInsideConnectedBands(band: DCGroup) {
    return (
      band.id === this.id ||
      this.connectedBands.find((_band) => _band.band.id === band.id)
    );
  }

  // Get the member of the main band that are members of the connected band
  private getConnectedBandMembers(band: DCGroup): Artist[] {
    return this.members.filter((member) =>
      member.bands.find((_band) => _band.id === band.id)
    );
  }

  // Order connected bands by number of members in common with then main band
  private orderConnectedBands(): void {
    this.connectedBands.sort(
      (band1, band2) => band2.members.length - band1.members.length
    );
  }

  // Nicely log connected bands and their members in common with the main band
  private logConnectedBands(): void {
    this.connectedBands.forEach((band) => {
      const url = `${DISCOGS_ARTIST_URL}${band.band.id}`;
      const featuring = band.members.map((member) => member.name).join(", ");
      logSeparator();
      logInfo(`🔗 Connected band "${clean(band.band.name)}" (${url})`);
      logInfo(`${band.members.length} member(s): ${featuring}`);
    });
  }
}
