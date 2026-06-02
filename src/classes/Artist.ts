import { ARTIST_RELEASE_ROLES } from "../../src_old/env";
import { log } from "../../src_old/log";
import { fetchArtistReleases } from "../api";
import { logSuccess, logWarning } from "../log";
import { DCArtist, DCArtistRelease } from "../types";
import { ArtistRelease } from "./ArtistRelease";
import { Discography } from "./Discography";
import { Release } from "./Release";

/**
 * An artist, which can be a band or a person
 */
export class Artist {
  // The artist object
  artist: DCArtist;

  constructor(artist: DCArtist) {
    this.artist = artist;

    logSuccess(`🎸 Fetched artist "${this.name}" (${this.url})`);
  }

  get id() {
    return this.artist.id;
  }

  get name() {
    return this.artist.name;
  }

  get url() {
    return this.artist.resource_url;
  }

  get groups() {
    return this.artist.groups ?? [];
  }

  // Fetch the releases associated to the artist
  public async fetchReleases() {
    // Initiate the releases fetching on page 1
    this.fetchReleasesPage(1);
  }

  // Fetch the releases associated to the artist (at a given page of the API)
  private async fetchReleasesPage(page: number) {
    const artistReleases = await fetchArtistReleases(this.id, page);

    if (page === 1) {
      logSuccess(`🎼 ${artistReleases.pagination.items} release(s) found`);
    }

    await this.analyzeReleases(artistReleases.releases);

    // Handle the next page if any
    if (artistReleases.pagination.pages > page) {
      await this.fetchReleasesPage(page + 1);
    }
  }

  // Loop over the given releases and add them to the global discography
  private async analyzeReleases(artistReleases: DCArtistRelease[]) {
    for (const artistRelease of artistReleases) {
      const artistReleaseDetails = new ArtistRelease(artistRelease);

      await artistReleaseDetails.addToDiscography();
    }
  }
}
