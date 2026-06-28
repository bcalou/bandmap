import { Logger } from "../log";
import { Api } from "./Api";
import { Band } from "./Band";

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

  // The api object
  private api: Api;

  // The logger object
  private logger: Logger;

  constructor(bandId: number, expectedIdList?: string) {
    this.bandId = bandId;
    this.expectedIdList = expectedIdList;
    this.api = new Api();
    this.logger = new Logger();
    this.init();
  }

  // Main sequence of events
  private async init() {
    const band = await this.api.getArtist(this.bandId);
    this.logger.initLogFile(`./logs/bands/${band.id}_${band.name}.txt`);
    this.band = new Band(band);

    await this.band.fetchMembersAndConnectedBands();

    await this.band.fetchReleases();

    this.band.discography.sort();

    this.logFinalOutput();

    this.testResult();
  }

  // Log the final output
  private logFinalOutput() {
    this.logger.logThickSeparator();

    this.band?.discography.logRejected();

    this.logger.logThickSeparator();

    this.band?.discography.logAccepted();
  }

  // Test the program result against what's expected
  private testResult() {
    if (this.expectedIdList) {
      const idList = this.band?.discography.getAcceptedIdList();

      if (idList === this.expectedIdList) {
        this.logger.logSuccess(`✓ IDs list matches expectation: ${idList}`);
      } else {
        this.logger.logError(`❌ IDs list doesn't match the expected result`);
        this.logger.log(`Expected: ${this.expectedIdList}`);
        this.logger.log(`Got:      ${idList}`);
      }
    }
  }
}
