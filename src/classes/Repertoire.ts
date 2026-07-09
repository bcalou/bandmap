import { OPTION_TITLE_SIMILARITY_THRESHOLD } from "../env";
import { DCTrack } from "../types";
import { Band } from "./Band";
import { Logger } from "./Logger";
import { Release } from "./Release";
var stringSimilarity = require("string-similarity");

// A track from the repertoire
type Track = {
  // The track title
  title: string;
  // The variation of the title found in other releases
  variations: string[];
  // The releases in which the track has been found
  releases: Release[];
};

/**
 * The list of tracks performed by a band or artist
 */
export class Repertoire {
  // The band
  private band: Band;

  // The list of tracks
  private tracks: Track[] = [];

  // The logger object
  private logger: Logger;

  constructor(band: Band) {
    this.band = band;
    this.logger = new Logger();
  }

  // Add the tracks from the given release to the repertoire
  public addReleaseTracks(release: Release) {
    this.getReleaseTracks(release).forEach((releaseTrack) => {
      let track = this.tracks.find((_track) =>
        this.isSimilarTrackName(_track.title, releaseTrack.title)
      );

      if (track) {
        this.addTrackVariation(releaseTrack, release, track);
      } else {
        this.addNewTrack(releaseTrack, release);
      }
    });
  }

  // Nicely log the list of the tracks from the repertoire
  public logTracks() {
    this.logger.log(`${this.tracks.length} track(s):`);
    this.logger.logSeparator();
    this.tracks
      .sort((track1, track2) => track1.title.localeCompare(track2.title))
      .forEach(this.logTrack.bind(this));
  }

  // Does the given release contain tracks that are not in the repertoire yet?
  public hasUnregisteredTracks(release: Release): boolean {
    return !!this.getReleaseTracks(release).find(
      (track) =>
        !track.artists?.every(
          (artist) => !this.band.isArtistConnectedToBand(artist.id)
        ) &&
        track.title.indexOf(" = ") === -1 &&
        this.tracks.every(
          (_track) => !this.isSimilarTrackName(track.title, _track.title)
        )
    );
  }

  // Get the list of tracks for the given release
  private getReleaseTracks(release: Release): DCTrack[] {
    return release.tracklist.filter((track) => track.type_ === "track");
  }

  // Log a track details
  private logTrack(track: Track) {
    this.logger.log(track.title);
    if (track.variations.length) {
      this.logger.log(`Variation(s): ${track.variations.join(", ")}`);
    }
    this.logger.log(
      `Release(s): ${track.releases.map((release) => release.title).join(", ")}`
    );
    this.logger.logSeparator();
  }

  // Are the two track title similar enough to consider that they're the same?
  private isSimilarTrackName(track1: string, track2: string) {
    return (
      stringSimilarity.compareTwoStrings(
        this.normalizeTitle(track1),
        this.normalizeTitle(track2)
      ) > OPTION_TITLE_SIMILARITY_THRESHOLD
    );
  }

  // Add a track variation to the repertoire
  private addTrackVariation(track: DCTrack, release: Release, addTo: Track) {
    if (
      track.title !== addTo.title &&
      !addTo.variations.find((variation) => variation === track.title)
    ) {
      addTo.variations.push(track.title);
    }
    addTo.releases.push(release);
  }

  // Add a new track to the repertoire
  private addNewTrack(track: DCTrack, release: Release) {
    this.tracks.push({
      title: track.title,
      variations: [],
      releases: [release],
    });
  }

  // Convert a string to a normalized, comparable string
  private normalizeTitle(title: string) {
    return title.replace(/^.*=/g, "").replace(/\s*[\(\{\[].*?[\)\}\]]\s*/g, "");
  }
}
