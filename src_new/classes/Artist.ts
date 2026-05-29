import { fetchArtistReleases } from "../api";
import { logSuccess } from "../log";
import { ArtistModel, ArtistReleasesModel } from "../types";

/**
 * An artist, which can be a band or a person
 */
export class Artist {
  artist: ArtistModel;

  constructor(artist: ArtistModel) {
    this.artist = artist;

    logSuccess(
      `🎸 Fetched artist ${this.artist.id}: "${this.artist.name}" (${this.artist.resource_url})`,
    );
  }

  /**
   * Fetch the releases associated to the artist
   */
  public fetchReleases(page: number): Promise<ArtistReleasesModel> {
    return fetchArtistReleases(this.artist.id, page);
  }
}
