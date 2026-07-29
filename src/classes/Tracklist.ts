import { IGNORE_TITLE_ENDINGS } from "../env";
import { DCTrack } from "../types";
import { normalize } from "../utils";
import { Release } from "./Release";

/**
 * The tracklist of a release
 */
export class Tracklist {
  // The associated release
  private release: Release;

  constructor(release: Release) {
    this.release = release;
  }

  get tracklist() {
    return this.release.release.tracklist;
  }

  // Get the list of tracks for the given release
  public getValidTracks(): DCTrack[] {
    return this.tracklist.filter(
      (track, index) =>
        !["DVD", "BR"].find((prefix) => track.position.startsWith(prefix)) &&
        !track.position.charAt(-1).match(/[a-z]/i) &&
        this.isValidTrackType(track, index) &&
        // Ignore track not written by the artist
        (this.release.artists.length === 1 ||
          [...(track.artists ?? []), ...(track.extraartists ?? [])]?.find(
            (artist) =>
              this.release.mainBand.id === artist.id ||
              this.release.mainBand.members.find(
                (member) => member.id === artist.id
              )
          )) &&
        // Ignore track containing an equal (translation title)
        track.title.indexOf(" = ") === -1 &&
        // Ignore specific title ending such as "edit" or "version"
        !IGNORE_TITLE_ENDINGS.find((ending) =>
          normalize(track.title.toLowerCase()).endsWith(ending.toLowerCase())
        )
    );
  }

  // Return true if the given track is of a valid type in the tracklist
  private isValidTrackType(track: DCTrack, index: number): boolean {
    return (
      track.type_ === "track" ||
      track.type_ === "index" ||
      (track.type_ === "heading" &&
        !!this.tracklist[index + 1].position.charAt(-1).match(/[a-z]/i))
    );
  }
}
