import z from "zod";
import { fetchArtist } from "../api";
import { logSuccess } from "../log";
import { ArtistReleasesManager } from "./ArtistReleases";

export type Artist = z.infer<typeof Artist>;
export const Artist = z.object({
  id: z.number(),
  name: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
});

export class ArtistManager {
  private artist: Promise<Artist>;

  constructor(id: number) {
    this.artist = fetchArtist(id);
    this.init();
  }

  /**
   * Main sequence
   */
  async init() {
    const artist = await this.artist;
    logSuccess(`Fetched artist ${artist.id}: "${artist.name}"`);

    new ArtistReleasesManager(artist.id);
  }
}
