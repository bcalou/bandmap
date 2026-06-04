import { fetchArtistReleases } from "../api";
import { logSeparator, logSuccess } from "../log";
import { DCArtist, DCArtistRelease } from "../types";
import { clean } from "../utils";
import { ArtistRelease } from "./ArtistRelease";
import { Band } from "./Band";

/**
 * An artist, which can be a band or a person
 */
export class Artist {
  // The artist object
  artist: DCArtist;

  // The main band object of the program
  // Undefined if the artist is the band itself
  mainBand: Band | undefined;

  constructor(artist: DCArtist, mainBand?: Band) {
    this.artist = artist;
    this.mainBand = mainBand;

    logSuccess(
      `${this.type === "artist" ? "🎤" : "🎸"} Fetched ${this.type} "${
        this.name
      }" (${this.url})`
    );
  }

  get id() {
    return this.artist.id;
  }

  get name() {
    return clean(this.artist.name);
  }

  get url() {
    return this.artist.uri;
  }

  get band(): Band | undefined {
    return this.mainBand;
  }

  get bands() {
    return this.artist.groups ?? [];
  }

  get type() {
    return this.artist.members ? "band" : "artist";
  }

  // Fetch the releases associated to the artist
  public async fetchReleases(): Promise<void> {
    // Initiate the releases fetching on page 1
    return this.fetchReleasesPage(1);
  }

  // Fetch the releases associated to the artist (at a given page of the API)
  private async fetchReleasesPage(page: number): Promise<void> {
    logSeparator();
    const artistReleases = await fetchArtistReleases(this.id, page);

    if (page === 1) {
      logSuccess(`🎼 ${artistReleases.pagination.items} release(s) found`);
    }

    await this.analyzeReleases(artistReleases.releases);

    // Handle the next page if any
    if (artistReleases.pagination.pages > page) {
      return await this.fetchReleasesPage(page + 1);
    }
  }

  // Loop over the given releases and add them to the global discography
  private async analyzeReleases(
    artistReleases: DCArtistRelease[]
  ): Promise<void> {
    for (const artistRelease of artistReleases) {
      if (this.band) {
        const artistReleaseDetails = new ArtistRelease(
          artistRelease,
          this.band
        );

        await artistReleaseDetails.addToDiscography();
      }
    }
  }
}
