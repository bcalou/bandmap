import { Logger } from "./Logger";
import { Release } from "./Release";

/**
 * The list of tracks performed by a band or artist
 */
export class Repertoire {
  // The list of tracks
  private tracks: string[] = [];

  // The logger object
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  // Add the tracks from the given release to the repertoire
  public addReleaseTracks(release: Release) {
    release.tracklist.forEach((track) => this.tracks.push(track.title));
  }

  public logTracks() {
    this.tracks.sort().forEach((track) => this.logger.log(track));
  }

  // Is the release tracklist mostly included in the repertoire?
  public tracklistIsAlreadyInRepertoire(release: Release): boolean {
    return release.tracklist.every((track) =>
      this.tracks.find((_track) => _track === track.title)
    );
  }
}
