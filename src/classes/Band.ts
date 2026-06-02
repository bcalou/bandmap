import { fetchArtist } from "../api";
import { logSuccess, logWarning } from "../log";
import { DCArtist, DCGroup, DCMember } from "../types";
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
  private connectedBands: DCGroup[] = [];

  constructor(band: DCArtist) {
    this.band = band;
  }

  get bandMembers() {
    return this.band.members ?? [];
  }

  // Fetch each of the band members and its connected bands infos
  public async fetchMembersAndConnectedBands() {
    for (const _member of this.bandMembers) {
      const member = new Artist(await fetchArtist(_member.id));

      this.members.push(member);

      member.groups?.forEach((group) => {
        if (!this.connectedBands.find((band) => band.id === group.id)) {
          logSuccess(`    🔗 Add connected band "${group.name}"`);

          this.connectedBands.push(group);
        } else {
          logWarning(`    🔗 Found already added band "${group.name}"`);
        }
      });
    }
  }
}
