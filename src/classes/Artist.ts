import { Release } from "../../src_old/types";
import { fetchArtist, fetchArtistReleases } from "../api";
import { DISCOGS_ARTIST_URL } from "../env";
import { logInfo, logSeparator, logSuccess } from "../log";
import { Credit, DCAlias, DCArtist, DCArtistRelease } from "../types";
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

    logSeparator();
    logSuccess(`${this.typeIcon} Fetched ${this.type} ${this.name}`);
    logSuccess(`(${this.url})`);
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

  get typeIcon() {
    return this.type === "artist" ? "🎤" : "🎸";
  }

  get aliases() {
    return this.artist.aliases ?? [];
  }

  // Does the given id match the artist or one of its aliases?
  public matchesId(id: number): boolean {
    return this.id === id || this.aliases.map((alias) => alias.id).includes(id);
  }

  // Is the artist one of the main author of this release?
  public isAuthor(release: Release) {
    return release.artists.find((artist) => this.matchesId(artist.id));
  }

  // Fetch the releases associated to the artist
  public async fetchReleases(): Promise<void> {
    // Initiate the releases fetching on page 1
    await this.fetchReleasesPage(1, this);

    for (const alias of this.aliases) {
      logSeparator();
      const aliasUrl = `${DISCOGS_ARTIST_URL}${alias.id}`;
      logInfo(`Looking at ${this.name} alias ${alias.name}`);
      logInfo(`(${aliasUrl})`);

      await this.fetchReleasesPage(1, alias);
    }
  }

  // Fetch the releases associated to the artist (at a given page of the API)
  private async fetchReleasesPage(
    page: number,
    from: Artist | DCAlias
  ): Promise<void> {
    logSeparator();
    const artistReleases = await fetchArtistReleases(from.id, page);
    const count = artistReleases.pagination.items;

    if (page === 1) {
      logInfo(`🎼 ${from.name}: ${count} release(s) found`);
    }

    await this.analyzeReleases(artistReleases.releases);

    // Handle the next page if any
    if (artistReleases.pagination.pages > page) {
      return await this.fetchReleasesPage(page + 1, from);
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
