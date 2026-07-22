import { string } from "zod";
import {
  IGNORE_TITLE_ENDINGS,
  OPTION_TITLE_SIMILARITY_THRESHOLD,
} from "../env";
import { DCTrack } from "../types";
import {
  getStringParts,
  normalize,
  removeDetails,
  stringsAreSimilar,
} from "../utils";
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
  // The different sections of the track, if any
  subTracks: string[];
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
        this.areSimilarTrackNames(_track.title, releaseTrack.title)
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
      .forEach((track) => {
        this.logTrack(track);
        this.logger.logSeparator();
      });
  }

  // Count how many tracks are not registered in this release
  public getUnregisteredTracks(release: Release): DCTrack[] {
    return this.getReleaseTracks(release).filter((track) =>
      this.trackIsUnregistered(track)
    );
  }

  // Try to find the given track inside the repertoire
  private trackIsUnregistered(track: DCTrack) {
    return this.tracks.every(
      (_track) =>
        !this.areSimilarTrackNames(track.title, _track.title) &&
        !_track.subTracks.find((subtrack) =>
          this.areSimilarTrackNames(track.title, subtrack)
        ) &&
        !_track.variations.find((variation) =>
          this.areSimilarTrackNames(track.title, variation)
        )
    );
  }

  // Get the list of tracks for the given release
  private getReleaseTracks(release: Release): DCTrack[] {
    return release.tracklist.filter(
      (track, index) =>
        !track.position.charAt(-1).match(/[a-z]/i) &&
        this.isValidTrackType(track, index, release) &&
        // Ignore track not written by the artist
        !track.artists?.every((artist) => this.band.id !== artist.id) &&
        // Ignore track containing an equal (translation title)
        track.title.indexOf(" = ") === -1 &&
        // Ignore specific title ending such as "edit" or "version"
        !IGNORE_TITLE_ENDINGS.find((ending) =>
          normalize(track.title.toLowerCase()).endsWith(ending.toLowerCase())
        )
    );
  }

  // Return true if the given track is of a valid type in the tracklist
  private isValidTrackType(
    track: DCTrack,
    index: number,
    release: Release
  ): boolean {
    return (
      track.type_ === "track" ||
      track.type_ === "index" ||
      (track.type_ === "heading" &&
        !!release.tracklist[index + 1].position.charAt(-1).match(/[a-z]/i))
    );
  }

  // Log a track details
  private logTrack(track: Track) {
    this.logger.log(track.title);
    if (track.variations.length) {
      this.logger.log(`Variation(s): ${track.variations.join(", ")}`);
    }
    if (track.subTracks.length) {
      this.logger.log(`Sub tracks: ${track.subTracks.join(", ")}`);
    }
    this.logger.log(
      `Release(s): ${track.releases.map((release) => release.title).join(", ")}`
    );
  }

  // Get the actual title of the track (or main track if subtrack)
  private getTrackTitle(track: DCTrack, release: Release) {
    if (track.title.charAt(-1).match(/[a-z]/i)) {
      for (let i = release.tracklist.indexOf(track); i >= 0; i--) {
        if (track.type_ === "heading") {
          return track.title;
        }
      }
    }

    return track.title;
  }

  // Are the two track title similar enough to consider that they're the same?
  private areSimilarTrackNames(track1: string, track2: string) {
    const track1Parts = getStringParts(track1);
    const track2Parts = getStringParts(track2);

    return [track1, ...track1Parts].find((track1part) =>
      [track2, ...track2Parts].find((track2part) =>
        stringsAreSimilar(track1part, track2part)
      )
    );
  }

  // Are the two track title similar when removing the content in parenthesis?
  private areSimilarTrackNamesWithoutDetails(
    track1: string,
    track2: string
  ): boolean {
    return (
      stringSimilarity.compareTwoStrings(
        normalize(removeDetails(track1)),
        normalize(removeDetails(track2))
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
      subTracks: track.sub_tracks?.map((subTrack) => subTrack.title) ?? [],
      releases: [release],
    });
  }
}
