import { DCTrack, RejectReason } from "../types";
import { ArtistRelease } from "./discogs/ArtistRelease";
import { Band } from "./discogs/Band";
import { Logger } from "./common/Logger";
import { Release } from "./discogs/release/Release";
import { Repertoire } from "./Repertoire";

// A release that could be included in the final discography
export type DiscographyRelease = {
  // The release object
  release: Release;
  // The tracks that are not included in the base albums and justify the
  // inclusion of the release, if any
  unregisteredTracks?: DCTrack[] | undefined;
};

/**
 * A discography, which is, in the case of this app, the list of releases from
 * the band with connected releases
 */
export class Discography {
  // The list of releases constituting the final discography
  private releases: DiscographyRelease[] = [];

  // The list of releases that could be included in the final discography
  private candidates: DiscographyRelease[] = [];

  // The list of songs performed by the band and its connected artists/bands
  public repertoire: Repertoire;

  // The logger object
  private logger: Logger;

  // The list of releases that were considered but not used
  // For some of them, the ArtistRelease object info was enough to reject them,
  // hence the type
  private rejected: {
    // The release object
    release: ArtistRelease | Release;
    // The reason why it was rejected
    reason: RejectReason;
  }[] = [];

  constructor(band: Band) {
    this.logger = new Logger();
    this.repertoire = new Repertoire(band);
  }

  // Get the releases
  public getReleases() {
    return this.releases;
  }

  // Get the candidate releases
  public getCandidateReleases() {
    return this.candidates;
  }

  // Add a release to the discography
  public async addAccepted(release: Release, unregisteredTracks?: DCTrack[]) {
    await release.extractPreciseDate();
    await release.extractCredits();
    this.logger.logSuccess(`💿 ${release.label}`);
    this.logger.log(release.formattedCredits);
    this.logger.logSeparator();
    this.releases.push({ release, unregisteredTracks });
    this.repertoire.addReleaseTracks(release);
  }

  // Add a candidate to the discography
  public addCandidate(release: Release) {
    this.logger.logInfo(`⌛ ${release.label}`);
    this.logger.log(release.formattedCredits);
    this.logger.logSeparator();
    this.candidates.push({ release });
  }

  // Add a release to the rejected list
  public addRejected(
    artistRelease: ArtistRelease | Release,
    reason: RejectReason
  ) {
    this.logger.logError(`❌ ${artistRelease.label}`);
    this.logger.logError(`${reason}`);
    this.logger.logSeparator();
    this.rejected.push({ release: artistRelease, reason });
  }

  // If the given id is included in the discography, return whether it's
  // candidate or rejected. Return false if the id is not present at all.
  public includes(id: number): "accepted" | "candidate" | "rejected" | false {
    if (this.releases.find((release) => release.release.discographyId === id))
      return "accepted";

    if (this.candidates.find((release) => release.release.discographyId === id))
      return "candidate";

    if (this.rejected.find((release) => release.release.id === id))
      return "rejected";

    return false;
  }

  // Select the candidate that has the most unreleased tracks, if any
  public async selectCandidatesWithUnregisteredTracks() {
    for (const candidate of this.candidates) {
      candidate.unregisteredTracks = this.repertoire.getUnregisteredTracks(
        candidate.release
      );

      if (candidate.unregisteredTracks.length) {
        await candidate.release.extractPreciseDate();
      }
    }

    this.sortReleasesArray(this.candidates);

    for (const candidate of this.candidates) {
      const candidatesAtThisDate = this.candidates.filter(
        (_candidate) =>
          _candidate.release.released === candidate.release.released
      );

      for (const candidateAtThisDate of candidatesAtThisDate) {
      }

      await this.selectCandidate(
        candidate,
        this.repertoire.getUnregisteredTracks(candidate.release)
      );
    }
  }

  // Move a release from the candidate list to the accepted or reject list
  private async selectCandidate(
    candidate: DiscographyRelease,
    unregisteredTrack: DCTrack[]
  ) {
    if (unregisteredTrack.length) {
      this.logCandidateUnregisteredTracks(candidate);
      this.candidates = this.candidates.filter(
        (_candidate) => _candidate.release.id !== candidate.release.id
      );
      await this.addAccepted(candidate.release, unregisteredTrack);
    } else {
      this.addRejected(candidate.release, "No new tracks");
    }
  }

  // Log infos about a candidate unregistered tracks
  private logCandidateUnregisteredTracks(candidate: DiscographyRelease) {
    const count = candidate.unregisteredTracks?.length;
    this.logger.logInfo(`Found candidate with ${count} unregistered track(s):`);

    candidate.unregisteredTracks?.forEach((track) =>
      this.logger.logInfo(`🎵 ${track.title}`)
    );
  }

  // Sort releases by release date
  public sort() {
    this.sortReleasesArray(this.releases);
    this.sortReleasesArray(this.candidates);

    this.rejected.sort((release1, release2) =>
      (release1.release.year ?? "")
        .toString()
        .localeCompare((release2.release.year ?? "").toString())
    );
  }

  // Sort two releases based on their formatted date
  // A release only dated with a year must come after the releases of the same
  // year more precisely date
  public sortByFormattedDate(release1: Release, release2: Release) {
    // Add XX-XX to year only date will "push them" at the end of the year
    const date1 =
      release1.formattedDate === release1.year
        ? `${release1.year}-XX-XX`
        : release1.formattedDate;
    const date2 =
      release2.formattedDate === release2.year
        ? `${release2.year}-XX-XX`
        : release2.formattedDate;

    return date1.localeCompare(date2);
  }

  // Log the list of accepted releases
  public logAccepted() {
    this.logger.logSuccess(`${this.releases.length} release(s):`);
    this.logger.logSeparator();

    this.releases.forEach((release) => {
      this.logger.logSuccess(`💿 ${release.release.label}`);
      this.logUnregisteredTracks(release);
      this.logger.log(release.release.formattedCredits);
      this.logger.logSeparator();
    });
  }

  // Log the list of rejected releases and the reject reason
  public logRejected() {
    this.logger.logWarning(`${this.rejected.length} rejected release(s):`);
    this.logger.logSeparator();

    this.rejected.forEach((release) => {
      this.logger.logWarning(`❌ ${release.release.label}`);
      this.logger.log(`(${release.reason})`);
      this.logger.logSeparator();
    });
  }

  // Get the ID list of accepted releases
  public getAcceptedIdList(): string {
    return this.releases.map((release) => release.release.id).join(",");
  }

  // Sort a release group by release date
  private sortReleasesArray(releases: DiscographyRelease[]) {
    releases.sort((release1, release2) => {
      if (release1.release.formattedDate === release2.release.formattedDate) {
        return (
          (release2.unregisteredTracks?.length ?? 0) -
          (release1.unregisteredTracks?.length ?? 0)
        );
      }

      return this.sortByFormattedDate(release1.release, release2.release);
    });
  }

  private logUnregisteredTracks(release: DiscographyRelease) {
    if (release.unregisteredTracks) {
      this.logger.log(
        "Including non-album track(s):" +
          release.unregisteredTracks
            ?.map((track) => `\n🎵 ${track.title}`)
            .join("")
      );
    }
  }
}
