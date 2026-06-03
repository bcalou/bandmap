import { ArtistReleases } from "../../src_old/types";
import { fetchArtist } from "../api";
import { DCArtistRelease, DCRelease } from "../types";
import { Artist } from "./Artist";
import { ArtistRelease } from "./ArtistRelease";
import { Band } from "./Band";
import { Discography } from "./Discography";
import { Release } from "./Release";

/**
 * Main class of the program.
 * It organizes the releases of a band and its connected artists/releases.
 */
export class BandMap {
  // The ID of the main band
  private bandId: number;

  // The band we're loonking at
  private band: Band | undefined;

  constructor(bandId: number) {
    this.bandId = bandId;
    this.init();
  }

  // Main sequence of events
  async init() {
    const band = await fetchArtist(this.bandId);
    this.band = new Band(band);

    await this.band.fetchMembersAndConnectedBands();

    await this.band.fetchReleases();
  }
}
