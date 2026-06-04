import { logError, logSuccess } from "../log";
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
    console.log(release);
    logSuccess(`💿 ${release.label}`);
    this.releases.push(release);
  }

  // Add a release to the rejected list
  public addRejected(artistRelease: ArtistRelease, reason: RejectReason) {
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
}
