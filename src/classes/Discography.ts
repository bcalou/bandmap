import { log, logError, logSeparator, logSuccess, logWarning } from "../log";
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

  // The list of releases that were considered but not used
  // For some of them, the ArtistRelease object info was enough to reject them,
  // hence the type
  private rejectedReleases: {
    // The release object
    artistRelease: ArtistRelease;
    // The reason why it was rejected
    reason: RejectReason;
  }[] = [];

  constructor() {}

  // Add a release to the discography
  public addAccepted(release: Release) {
    logSeparator();
    logSuccess(`💿 ${release.label}`);
    log(release.formattedCredits);
    this.releases.push(release);
  }

  // Add a release to the rejected list
  public addRejected(artistRelease: ArtistRelease, reason: RejectReason) {
    logSeparator();
    logError(`❌ ${artistRelease.label} (${reason})`);
    this.rejectedReleases.push({ artistRelease, reason });
  }

  // If the given id is included in the discography, return whether it's
  // accepted or rejected. Return false if the id is not present at all.
  public includes(id: number): "accepted" | "rejected" | false {
    if (this.releases.find((release) => release.id === id)) {
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
      release1.date.localeCompare(release2.date)
    );

    this.rejectedReleases.sort((release1, release2) =>
      release1.artistRelease.year
        .toString()
        .localeCompare(release2.artistRelease.year.toString())
    );
  }

  // Log the list of accepted releases
  public logAccepted() {
    logSeparator();
    logSuccess(`${this.releases.length} release(s):`);

    this.releases.forEach((release) => {
      logSeparator();
      logSuccess(release.label);
      log(release.formattedCredits);
    });
  }

  // Log the list of rejected releases and the reject reason
  public logRejected() {
    logSeparator();
    logWarning(`${this.rejectedReleases.length} rejected release(s):`);
    logSeparator();

    this.rejectedReleases.forEach((release) => {
      logWarning(release.artistRelease.label);
      log(`(${release.reason})`);
    });
  }
}
