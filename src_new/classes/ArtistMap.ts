import { fetchArtist } from "../api";
import { ArtistModel, ArtistReleaseModel, ReleaseModel } from "../types";
import { Artist } from "./Artist";

/**
 * Main class of the program.
 * It organizes the release of a main artist and its connected artists/releases.
 */
export class ArtistMap {
  /**
   * The ID of the main artist
   */
  private artistId: number;
  /**
   * The object containing all the results
   */
  private releases: {
    valid: {
      release: ReleaseModel[];
      artists: ArtistModel[];
    }[];
    invalid: ArtistReleaseModel[];
  } = { valid: [], invalid: [] };

  constructor(artistId: number) {
    this.artistId = artistId;
    this.init();
  }

  /**
   * Main sequence of events
   */
  async init() {
    const artist = new Artist(await fetchArtist(this.artistId));

    artist.fetchReleases(releases);
  }
}
