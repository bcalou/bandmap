import { FORMATS, OPTION_FORMATS_PRIORITY } from "../env";
import { RejectReason } from "../types";
import { ArtistRelease } from "./ArtistRelease";
import { Band } from "./Band";
import { Logger } from "./Logger";
import { Release } from "./Release";
import { Repertoire } from "./Repertoire";

// A release that could be included in the final discography
export type CandidateRelease = {
  // The release object
  release: Release;
  // The number of tracks that are not included yet in the repertoire
  unregisteredTracksCount?: number | undefined;
};

/**
 * A discography, which is, in the case of this app, the list of releases from
 * the band with connected releases
 */
export class Discography {
  // The list of releases constituting the final discography
  private releases: Release[] = [];

  // The list of songs performed by the band and its connected artists/bands
  public repertoire: Repertoire;

  // The list of releases that could be included in the final discography
  private candidates: CandidateRelease[] = [];

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
  public async addAccepted(release: Release) {
    await release.extractPreciseDate();
    this.logger.logSuccess(`💿 ${release.label}`);
    this.logger.log(release.formattedCredits);
    this.logger.logSeparator();
    this.releases.push(release);
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
    if (this.releases.find((release) => release.discographyId === id))
      return "accepted";

    if (this.candidates.find((release) => release.release.discographyId === id))
      return "candidate";

    if (this.rejected.find((release) => release.release.id === id))
      return "rejected";

    return false;
  }

  // Select the candidate that has the most unreleased tracks, if any
  public async selectCandidatesWithMostUnregisteredTracks() {
    this.logger.logInfo("Looking for candidates with unregistered tracks");
    this.countUnregisteredTracksInCandidatesReleases();

    const trackCount = this.candidates[0].unregisteredTracksCount ?? 0;
    if (trackCount > 0) {
      await this.selectCandidate(this.candidates[0], true);
      await this.selectCandidatesWithMostUnregisteredTracks();
    } else {
      this.rejectRemainingCandidates();
    }

    this.logger.logSeparator();
  }

  // For each candidate release, count how many tracks are not registered yet
  private countUnregisteredTracksInCandidatesReleases() {
    this.candidates.forEach(
      (candidate) =>
        (candidate.unregisteredTracksCount =
          this.repertoire.getUnregisteredTracksCount(candidate.release))
    );

    this.candidates.sort(this.sortCandidateReleases);
  }

  // Sort two release candidates, depending of which has the most unregistered
  // tracks and their format
  private sortCandidateReleases(
    release1: CandidateRelease,
    release2: CandidateRelease
  ) {
    return release1.unregisteredTracksCount === release2.unregisteredTracksCount
      ? FORMATS.mainSortedByConsiderationOrder.indexOf(
          release1.release.getMainFormat() ?? ""
        ) -
          FORMATS.mainSortedByConsiderationOrder.indexOf(
            release2.release.getMainFormat() ?? ""
          )
      : (release2.unregisteredTracksCount ?? 0) -
          (release1.unregisteredTracksCount ?? 0);
  }

  // Move a release from the candidate list to the accepted or reject list
  private async selectCandidate(
    candidate: CandidateRelease,
    accepted: boolean
  ) {
    const tracks = candidate.unregisteredTracksCount;
    this.logger.logInfo(`Found candidate with ${tracks} unregistered track(s)`);

    this.candidates = this.candidates.filter(
      (_candidate) => _candidate.release.id !== candidate.release.id
    );

    if (accepted) {
      await this.addAccepted(candidate.release);
    } else {
      this.addRejected(candidate.release, "No new tracks");
    }
  }

  // Reject the remaining candidate releases
  private rejectRemainingCandidates() {
    for (const candidateRelease of this.candidates) {
      this.selectCandidate(candidateRelease, false);
    }
  }

  // Sort releases by release date
  public sort() {
    this.releases.sort(this.sortByFormattedDate);

    this.candidates.sort((candidate1, candidate2) =>
      this.sortByFormattedDate(candidate1.release, candidate2.release)
    );

    this.rejected.sort((release1, release2) =>
      (release1.release.year ?? "")
        .toString()
        .localeCompare((release2.release.year ?? "").toString())
    );
  }

  // Sort two releases based on their formatted date
  public sortByFormattedDate(release1: Release, release2: Release) {
    return release1.formattedDate.localeCompare(release2.formattedDate);
  }

  // Log the list of accepted releases
  public logAccepted() {
    this.logger.logSuccess(`${this.releases.length} release(s):`);
    this.logger.logSeparator();

    this.releases.forEach((release) => {
      this.logger.logSuccess(`💿 ${release.label}`);
      this.logger.log(release.formattedCredits);
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
    return this.releases.map((release) => release.id).join(",");
  }
}
