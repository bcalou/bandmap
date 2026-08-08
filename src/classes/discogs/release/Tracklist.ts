import { RULES } from "../../../rules";
import { DCTrack } from "../../../types";
import { normalize } from "../../../utils";
import { getLogger, Logger } from "../../common/Logger";
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

  // Is the tracklist valid? (meaning it contains at least 1 valid track)
  public isValid(): boolean {
    if (this.getValidTracks().length === 0) {
      getLogger().logWarning("📋 Invalid tracklist (no valid tracks)");

      return false;
    }

    return true;
  }

  // Get the list of tracks for the given release
  public getValidTracks(): DCTrack[] {
    return this.tracklist.filter((track, index) => {
      return this.isValidTrack(track, index);
    });
  }

  // Should the given track considered as a main track of the release?
  private isValidTrack(track: DCTrack, index: number): boolean {
    return (
      this.isValidTrackPosition(track) &&
      this.isValidTrackType(track, index) &&
      // Ignore track not written by the artist
      (this.release.artists.length === 1 ||
        !![...(track.artists ?? []), ...(track.extraartists ?? [])]?.find(
          (artist) =>
            this.release.mainBand.id === artist.id ||
            this.release.mainBand.members.find(
              (member) => member.id === artist.id
            )
        )) &&
      // Ignore track containing an equal (translation title)
      track.title.indexOf(" = ") === -1 &&
      // Ignore specific title ending such as "edit" or "version"
      !RULES.ignoreTracksEndingWith.find((ending) =>
        normalize(track.title.toLowerCase()).endsWith(ending.toLowerCase())
      )
    );
  }

  // Return true if the given track is of a valid type in the tracklist
  private isValidTrackType(track: DCTrack, index: number): boolean {
    return (
      track.type_ === "track" ||
      (track.type_ === "index" &&
        this.tracklist[index + 1] &&
        this.isValidTrack(this.tracklist[index + 1], index + 1))
    );
  }

  private isValidTrackPosition(track: DCTrack): boolean {
    return (
      // Exclude DVD-1, BR-1...
      !["DVD", "BD", "BR"].find((prefix) =>
        track.position.startsWith(prefix)
      ) &&
      // Exclude 1A, 1B...
      !track.position.charAt(-1).match(/[a-z]/i)
    );
  }
}
