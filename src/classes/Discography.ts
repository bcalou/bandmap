import { Logger } from "./Logger";
import { RejectReason } from "../types";
import { ArtistRelease } from "./ArtistRelease";
import { Release } from "./Release";

/**
 * A discography, which is, in the case of this app, the list of releases from
 * the band with connected releases
 */
export class Discography {
  // The list of releases constituting the discography
  private releases: Release[] = [];

  // The logger object
  private logger: Logger;

  // The list of releases that were considered but not used
  // For some of them, the ArtistRelease object info was enough to reject them,
  // hence the type
  private rejectedReleases: {
    // The release object
    artistRelease: ArtistRelease;
    // The reason why it was rejected
    reason: RejectReason;
  }[] = [];

  constructor() {
    this.logger = new Logger();
  }

  // Add a release to the discography
  public addAccepted(release: Release) {
    this.logger.logSuccess(`💿 ${release.label}`);
    this.logger.log(release.formattedCredits);
    this.logger.logSeparator();
    this.releases.push(release);
  }

  // Add a release to the rejected list
  public addRejected(artistRelease: ArtistRelease, reason: RejectReason) {
    this.logger.logError(`❌ ${artistRelease.label}`);
    this.logger.logError(`${reason}`);
    this.logger.logSeparator();
    this.rejectedReleases.push({ artistRelease, reason });
  }

  // If the given id is included in the discography, return whether it's
  // accepted or rejected. Return false if the id is not present at all.
  public includes(id: number): "accepted" | "rejected" | false {
    if (this.releases.find((release) => release.discographyId === id)) {
      return "accepted";
    }

    if (
      this.rejectedReleases.find((release) => release.artistRelease.id === id)
    ) {
      return "rejected";
    }

    return false;
  }

  // Sort releases by release date
  public sort() {
    this.releases.sort((release1, release2) =>
      release1.formattedDate.localeCompare(release2.formattedDate)
    );

    this.rejectedReleases.sort((release1, release2) =>
      release1.artistRelease.year
        .toString()
        .localeCompare(release2.artistRelease.year.toString())
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
      this.logger.logWarning(`❌ ${release.artistRelease.label}`);
      this.logger.log(`(${release.reason})`);
      this.logger.logSeparator();
    });
  }

  // Get the ID list of accepted releases
  public getAcceptedIdList(): string {
    return this.releases.map((release) => release.id).join(",");
  }
}
