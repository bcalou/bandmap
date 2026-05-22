import z from "zod";
import { fetchVersions } from "../api";
import { DISCOGS_RELEASE_URL, FORMATS } from "../env";
import { log } from "../log";

export type Versions = z.infer<typeof Versions>;
export const Versions = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  versions: z.array(
    z.object({
      id: z.number(),
      format: z.string(),
    })
  ),
});

export class VersionsManager {
  private versions: Promise<Versions>;

  /**
   * Return true if the list of formats indicate a valid release
   */
  static acceptFormats(formats: string[]): boolean {
    return (
      !!formats.find((format) => FORMATS.accept.includes(format)) &&
      !formats.find((format) => FORMATS.reject.includes(format))
    );
  }

  constructor(masterId: number) {
    this.versions = fetchVersions(masterId);
    this.init();
  }

  /**
   * Return true if one of the versions has a valid format list
   */
  public async hasValidVersion(): Promise<boolean> {
    const versions = await this.versions;

    return !!versions.versions.find((version) => {
      log(
        `Analyzing version ${version.id} (${DISCOGS_RELEASE_URL}${version.id})`
      );
      log(`Formats: ${version.format}`);

      return VersionsManager.acceptFormats(version.format.split(", "));
    });
  }

  /**
   * Main sequence
   */
  private async init() {
    const versions = await this.versions;

    if (versions.pagination.pages > 1) {
      throw new Error("Multiple page not handled yet!");
    }

    log(
      `Format of the main release rejected, looking into ${versions.versions.length} versions`
    );
  }
}
