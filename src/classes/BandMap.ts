import { Api, getApi } from "./common/Api";
import { Band } from "./discogs/Band";
import { getLogger, Logger } from "./common/Logger";

/**
 * Main class of the program.
 * It organizes the releases of a band and its connected artists/releases.
 */
export class BandMap {
  // The ID of the main band
  private bandId: number;

  // The band we're looking at
  private band: Band | undefined;

  // A list of ID that should to test the program output against
  private expectedIdList: string | undefined;

  constructor(bandId: number, expectedIdList?: string) {
    this.bandId = bandId;
    this.expectedIdList = expectedIdList;
    this.init();
  }

  // Main sequence of events
  public async init() {
    const band = await getApi().getArtist(this.bandId);
    getLogger().setLogFile(`band_${band.id}_${band.name}_details.txt`);
    this.band = new Band(band);

    await this.band.fetchMembersAndConnectedBands();

    await this.band.fetchReleases();

    await this.band.discography.selectCandidatesWithUnregisteredTracks();

    this.band.discography.sort();

    this.logFinalOutput();

    this.logIds();
  }

  // Log the final output
  private logFinalOutput() {
    this.setLogFile("rejected");

    this.band?.discography.logRejected();

    this.setLogFile("accepted");

    this.band?.discography.logAccepted();

    this.setLogFile("repertoire");

    this.band?.discography?.repertoire?.logTracks();
  }

  // Log the generated list of releases ID
  private logIds() {
    if (!this.band) return;

    this.setLogFile("tests");
    const idList = this.band.discography.getAcceptedIdList();

    if (this.expectedIdList) {
      this.compareToExpected(idList);
    } else {
      getLogger().log(`ID list: ${idList}`);
    }
  }

  // Test the program result against what's expected
  private compareToExpected(idList: string) {
    if (idList === this.expectedIdList) {
      getLogger().logSuccess(`✓ IDs list matches expectation: ${idList}`);
    } else {
      getLogger().logError(`❌ IDs list doesn't match the expected result`);
      getLogger().log(`Expected: ${this.expectedIdList}`);
      getLogger().log(`Got:      ${idList}`);
    }
  }

  // Set the log file name
  private setLogFile(name: string) {
    getLogger().setLogFile(
      `band_${this.band?.id}_${this.band?.name}_${name}.txt`
    );
  }
}
