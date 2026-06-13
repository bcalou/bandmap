import { fetchArtist } from "../api";
import { DISCOGS_ARTIST_URL } from "../env";
import { logInfo, logSeparator } from "../log";
import { DCArtist, DCExtraArtist, DCGroup } from "../types";
import { clean } from "../utils";
import { Artist } from "./Artist";
import { Discography } from "./Discography";
import { Master } from "./Master";
import { Release } from "./Release";

/**
 * The main band which we're looking at
 */
export class Band extends Artist {
  // The discography of the band and its connected artists/bands
  public discography: Discography;

  // The members of the band
  public members: Artist[] = [];

  // The other bands of the members of the main band
  public connectedBands: {
    // The discogs group object
    band: DCGroup;
    // The list of member from the main band
    members: Artist[];
  }[] = [];

  constructor(band: DCArtist) {
    super(band);
    this.discography = new Discography();
  }

  get band(): Band {
    return this;
  }

  private get bandMembers() {
    return this.artist.members ?? [];
  }

  // Is the given release from the band, one of its member or a connected band?
  public isAuthorOrConnectedAuthor(release: Release | Master) {
    return release.artists.find(
      (artist) =>
        artist.id === this.id ||
        this.members.find((member) => member.matchesId(artist.id)) ||
        this.connectedBands.find((band) => band.band.id === artist.id)
    );
  }

  // Is the artist the band itself or a member of the band?
  public isExtraArtistConnectedToBand(artist: DCExtraArtist) {
    return (
      artist.id === this.id ||
      this.members.find((member) => member.matchesId(artist.id))
    );
  }

  // Is the given release by one of the band members?
  public isByOneOfBandMembers(release: Release): boolean {
    return !!this.members.find((member) => member.isAuthor(release));
  }

  // Fetch each of the band members and its connected bands infos
  public async fetchMembersAndConnectedBands(): Promise<void> {
    logInfo(`👥 ${this.bandMembers.length} member(s)`);
    logSeparator();

    for (const _member of this.bandMembers) {
      const member = new Artist(await fetchArtist(_member.id), this.band);

      this.members.push(member);
    }

    this.fetchConnectedBands();
  }

  // Fetch the releases associated to the artist + the releases of the members
  public async fetchReleases() {
    await super.fetchReleases();

    for (const member of this.members) {
      await member.fetchReleases();
    }

    this.sortReleases();
  }

  // Fetch the bands connected to the main band members
  private fetchConnectedBands(): void {
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
    logInfo(`${this.connectedBands.length} connected band(s)`);
    logSeparator();

    this.connectedBands.forEach((band) => {
      const url = `${DISCOGS_ARTIST_URL}${band.band.id}`;
      const featuring = band.members.map((member) => member.name).join(", ");
      logInfo(`🔗 ${clean(band.band.name)}`);
      logInfo(`(${url})`);
      logInfo(`${band.members.length} member(s): ${featuring}`);
      logSeparator();
    });
  }

  // Sort the release by date
  private sortReleases(): void {}
}
