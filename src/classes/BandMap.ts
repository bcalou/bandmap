import { ArtistReleases } from "../../src_old/types";
import { fetchArtist } from "../api";
import {
  log,
  logError,
  logSeparator,
  logSuccess,
  logThickSeparator,
} from "../log";
import { DCArtistRelease, DCRelease } from "../types";
import { Artist } from "./Artist";
import { ArtistRelease } from "./ArtistRelease";
import { Band } from "./Band";
import { Discography } from "./Discography";
import { Release } from "./Release";

/**
 * Main class of the program.
 * It organizes the releases of a band and its connected artists/releases.
 */
export class BandMap {
  // The ID of the main band
  private bandId: number;

  // The band we're loonking at
  private band: Band | undefined;

  // A list of ID that should to test the program output against
  private expectedIdList: string | undefined;

  constructor(bandId: number, expectedIdList?: string) {
    this.bandId = bandId;
    this.expectedIdList = expectedIdList;
    this.init();
  }

  // Main sequence of events
  private async init() {
    const band = await fetchArtist(this.bandId);
    this.band = new Band(band);

    await this.band.fetchMembersAndConnectedBands();

    await this.band.fetchReleases();

    this.band.discography.sort();

    this.logFinalOutput();

    this.testResult();
  }

  // Log the final output
  private logFinalOutput() {
    logThickSeparator();

    this.band?.discography.logRejected();

    logThickSeparator();

    this.band?.discography.logAccepted();
  }

  // Test the program result against what's expected
  private testResult() {
    if (this.expectedIdList) {
      const idList = this.band?.discography.getAcceptedIdList();

      if (idList === this.expectedIdList) {
        logSuccess(`✓ IDs list matches the expected result: ${idList}`);
      } else {
        logError(`❌ IDs list doesn't match the expected result`);
        log(`Expected: ${this.expectedIdList}`);
        log(`Got:      ${idList}`);
      }
    }
  }
}
