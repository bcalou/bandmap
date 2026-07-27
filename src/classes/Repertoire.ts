import { IGNORE_TITLE_ENDINGS } from "../env";
import { DCTrack } from "../types";
import { getStringParts, normalize, stringsAreSimilar } from "../utils";
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
    this.getReleaseTracks(release)
      .map((track) => this.getNewTrackCandidate(track, release))
      .forEach((track) => {
        if (track.existing) {
          this.addTrackVariation({ ...track, existing: track.existing });
        } else {
          this.addNewTrack(track);
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

  // Get tracks that are not registered in this release
  public getUnregisteredTracks(release: Release): DCTrack[] {
    return this.getReleaseTracks(release).filter(
      (track) => !this.getExistingTrack(track),
    );
  }

  // Try to find the given track inside the repertoire
  private getExistingTrack(track: DCTrack) {
    return this.tracks.find(
      (_track) =>
        this.areSimilarTrackNames(track.title, _track.title) ||
        _track.subTracks.find((subtrack) =>
          this.areSimilarTrackNames(track.title, subtrack),
        ) ||
        _track.variations.find((variation) =>
          this.areSimilarTrackNames(track.title, variation),
        ),
    );
  }

  // Get the list of tracks for the given release
  private getReleaseTracks(release: Release): DCTrack[] {
    return release.tracklist.filter(
      (track, index) =>
        !["DVD", "BR"].find((prefix) => track.position.startsWith(prefix)) &&
        !track.position.charAt(-1).match(/[a-z]/i) &&
        this.isValidTrackType(track, index, release) &&
        // Ignore track not written by the artist
        !track.artists?.every((artist) => this.band.id !== artist.id) &&
        // Ignore track containing an equal (translation title)
        track.title.indexOf(" = ") === -1 &&
        // Ignore specific title ending such as "edit" or "version"
        !IGNORE_TITLE_ENDINGS.find((ending) =>
          normalize(track.title.toLowerCase()).endsWith(ending.toLowerCase()),
        ),
    );
  }

  // Return true if the given track is of a valid type in the tracklist
  private isValidTrackType(
    track: DCTrack,
    index: number,
    release: Release,
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
      `Release(s): ${track.releases.map((release) => release.title).join(", ")}`,
    );
  }

  // Are the two track title similar enough to consider that they're the same?
  private areSimilarTrackNames(track1: string, track2: string) {
    const track1Parts = getStringParts(track1);
    const track2Parts = getStringParts(track2);

    return [track1, ...track1Parts].find((track1part) =>
      [track2, ...track2Parts].find((track2part) =>
        stringsAreSimilar(track1part, track2part),
      ),
    );
  }

  // Get a new track candidate object based on a track
  private getNewTrackCandidate(track: DCTrack, release: Release) {
    return {
      track,
      release,
      existing: this.getExistingTrack(track),
    };
  }

  // Add a track variation to the repertoire
  private addTrackVariation(trackVariation: {
    track: DCTrack;
    release: Release;
    existing: Track;
  }) {
    if (
      trackVariation.track.title !== trackVariation.existing.title &&
      !trackVariation.existing.variations.find(
        (variation) => variation === trackVariation.track.title,
      )
    ) {
      trackVariation.existing.variations.push(trackVariation.track.title);
    }
    trackVariation.existing.releases.push(trackVariation.release);

    this.addSubTracks(trackVariation.existing, trackVariation.track);
  }

  // Add a new track to the repertoire
  private addNewTrack(newTrack: { track: DCTrack; release: Release }) {
    const track: Track = {
      title: newTrack.track.title,
      variations: [],
      subTracks: [],
      releases: [newTrack.release],
    };

    this.addSubTracks(track, newTrack.track);

    this.tracks.push(track);
  }

  // Add subtracks if not already present
  private addSubTracks(targetTrack: Track, trackContainingSubtracks: DCTrack) {
    if (
      !targetTrack.subTracks.length &&
      !!trackContainingSubtracks.sub_tracks
    ) {
      targetTrack.subTracks = trackContainingSubtracks.sub_tracks.map(
        (subTrack) => subTrack.title,
      );
    }
  }
}
