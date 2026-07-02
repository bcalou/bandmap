import { OPTION_TITLE_SIMILARITY_CONSIDERED_IDENTICAL } from "../env";
import { Logger } from "./Logger";
import { Release } from "./Release";
var stringSimilarity = require("string-similarity");

/**
 * The list of tracks performed by a band or artist
 */
export class Repertoire {
  // The list of tracks
  private tracks: {
    title: string;
    variations: string[];
    releases: Release[];
  }[] = [];

  // The logger object
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  // Add the tracks from the given release to the repertoire
  public addReleaseTracks(release: Release) {
    release.tracklist.forEach((releaseTrack) => {
      let track = this.tracks.find((_track) => this.isSimilarTrackName(_track.title, releaseTrack.title));
      console.log({track});

      if (track) {
        track.variations.push(releaseTrack.title);
        track.releases.push(release);
      } else {
        this.tracks.push({
          title: releaseTrack.title,
          variations: [],
          releases: [release],
        });
      }
    });
  }

  public logTracks() {
    this.logger.log(`${this.tracks.length} track(s):`);
    this.logger.logSeparator();
    this.tracks
      .sort((track1, track2) => track1.title.localeCompare(track2.title))
      .forEach((track) => {
        this.logger.log(track.title);
        if (track.variations.length) {
          this.logger.log(`Variation(s): ${track.variations.join(", ")}`);
        }
        this.logger.log(
          `Release(s): ${track.releases.map((release) => release.title).join(", ")}`,
        );
        this.logger.logSeparator();
      });
  }

  // Is the release tracklist mostly included in the repertoire?
  public tracklistIsAlreadyInRepertoire(release: Release): boolean {
    return true;
    // return release.tracklist.every((track) =>
    //   this.tracks.find((_track) => _track === track.title),
    // );
  }

  // Are the two track title similar enough to consider that they're the same?
  private isSimilarTrackName(track1: string, track2: string) {
    stringSimilarity.compareTwoStrings(track1, track2) >
      OPTION_TITLE_SIMILARITY_CONSIDERED_IDENTICAL;
  }
}
