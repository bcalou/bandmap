import { DISCOGS_ARTIST_URL, OPTION_INCLUDE_CONNECTED_RELEASES } from "../env";
import { DCArtist, DCExtraArtist, DCGroup } from "../types";
import { clean } from "../utils";
import { Artist } from "./Artist";
import { Discography } from "./Discography";
import { Master } from "./Master";
import { Release } from "./Release";
import { Repertoire } from "./Repertoire";

/**
 * The main band which we're looking at
 */
export class Band extends Artist {
  // The discography of the band and its connected artists/bands
  public discography: Discography;

  // The list of songs performed by the band and its connected artists/bands
  public repertoire: Repertoire;

  // The members of the band
  public members: Artist[] = [];

  // The other bands of the members of the main band
  public connectedBands: {
    // The discogs group object
    band: DCGroup;
    // The list of member from the main band
    members: Artist[];
  }[] = [];

  // The country in which most core releases were released
  public mainCountry: string | undefined;

  constructor(band: DCArtist) {
    super(band);
    this.discography = new Discography();
    this.repertoire = new Repertoire();
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
        (OPTION_INCLUDE_CONNECTED_RELEASES &&
          (this.members.find((member) => member.matchesId(artist.id)) ||
            this.connectedBands.find((band) => band.band.id === artist.id)))
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
    this.logger.logInfo(`👥 ${this.bandMembers.length} member(s)`);
    this.logger.logSeparator();

    for (const _member of this.bandMembers) {
      const member = new Artist(
        await this.api.getArtist(_member.id),
        this.band
      );

      this.members.push(member);
    }

    this.fetchConnectedBands();
  }

  // Fetch the releases associated to the artist + the releases of the members
  public async fetchReleases() {
    await super.fetchReleases();

    if (OPTION_INCLUDE_CONNECTED_RELEASES) {
      for (const member of this.members) {
        await member.fetchReleases();
      }
    }
  }

  // Find in which country most of the core releases were relesased
  public identifyMainCountry(): void {
    const countries = this.getReleasesCountByCountry();

    const maxReleases = Math.max(...Object.values(countries));
    this.mainCountry = Object.keys(countries).find(
      (key) => countries[key] === maxReleases
    );

    this.logger.logInfo(
      `🌎 Main country is ${this.mainCountry} with ${maxReleases} release(s)`
    );

    this.logger.log(JSON.stringify(countries));
  }

  // Get the number of releases in each country
  private getReleasesCountByCountry(): Record<string, number> {
    const countries: Record<string, number> = {};

    this.discography.getReleases().forEach((release) => {
      if (!release.country) return;

      if (!countries[release.country]) {
        countries[release.country] = 0;
      }

      countries[release.country]++;
    });

    return countries;
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
    this.logger.logInfo(`${this.connectedBands.length} connected band(s)`);
    this.logger.logSeparator();

    this.connectedBands.forEach((band) => {
      const url = `${DISCOGS_ARTIST_URL}${band.band.id}`;
      const featuring = band.members.map((member) => member.name).join(", ");
      this.logger.logInfo(`🔗 ${clean(band.band.name)}`);
      this.logger.logInfo(`(${url})`);
      this.logger.logInfo(`${band.members.length} member(s): ${featuring}`);
      this.logger.logSeparator();
    });
  }
}
