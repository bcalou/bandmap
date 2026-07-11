import { OPTION_SECONDARY_FORMATS_LOOKUP_ORDER } from "../env";
import { RejectReason } from "../types";
import { ArtistRelease } from "./ArtistRelease";
import { Band } from "./Band";
import { Logger } from "./Logger";
import { Release } from "./Release";
import { Repertoire } from "./Repertoire";

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
  private candidateReleases: Release[] = [];

  // The logger object
  private logger: Logger;

  // The list of releases that were considered but not used
  // For some of them, the ArtistRelease object info was enough to reject them,
  // hence the type
  private rejectedReleases: {
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
    return this.candidateReleases;
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
    this.candidateReleases.push(release);
  }

  // Add a release to the rejected list
  public addRejected(
    artistRelease: ArtistRelease | Release,
    reason: RejectReason
  ) {
    this.logger.logError(`❌ ${artistRelease.label}`);
    this.logger.logError(`${reason}`);
    this.logger.logSeparator();
    this.rejectedReleases.push({ release: artistRelease, reason });
  }

  // If the given id is included in the discography, return whether it's
  // candidate or rejected. Return false if the id is not present at all.
  public includes(id: number): "accepted" | "candidate" | "rejected" | false {
    if (this.releases.find((release) => release.discographyId === id))
      return "accepted";

    if (this.candidateReleases.find((release) => release.discographyId === id))
      return "candidate";

    if (this.rejectedReleases.find((release) => release.release.id === id))
      return "rejected";

    return false;
  }

  // Select which candidate releases are actually valid
  public async selectValidCandidates() {
    for (const release of this.candidateReleases) {
      if (release.isMainFormat("Album")) {
        await this.selectCandidate(release, true);
      }
    }

    await this.selectSecondaryRelease();
  }

  // Select the secondary releases containing new track
  private async selectSecondaryRelease() {
    for (const format of OPTION_SECONDARY_FORMATS_LOOKUP_ORDER) {
      this.logger.log(`Looking for valid candidates for "${format}" format`);
      for (const release of this.candidateReleases.filter((release) =>
        release.isMainFormat(format)
      )) {
        await this.selectCandidate(release);
      }
      this.logger.logSeparator();
    }
  }

  // Move a release from the candidate list to the accepted list
  private async selectCandidate(release: Release, isCoreRelease?: boolean) {
    this.candidateReleases = this.candidateReleases.filter(
      (_release) => _release.id !== release.id
    );

    if (isCoreRelease || this.repertoire.hasUnregisteredTracks(release)) {
      await this.addAccepted(release);
    } else {
      this.addRejected(release, "No new tracks");
    }
  }

  // Sort releases by release date
  public sort() {
    [this.releases, this.candidateReleases].forEach((releaseGroup) => {
      releaseGroup.sort((release1, release2) =>
        release1.formattedDate.localeCompare(release2.formattedDate)
      );
    });

    this.rejectedReleases.sort((release1, release2) =>
      (release1.release.year ?? "")
        .toString()
        .localeCompare((release2.release.year ?? "").toString())
    );
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
    this.logger.logWarning(
      `${this.rejectedReleases.length} rejected release(s):`
    );
    this.logger.logSeparator();

    this.rejectedReleases.forEach((release) => {
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
