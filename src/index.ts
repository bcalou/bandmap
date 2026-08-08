import { BandMap } from "./classes/BandMap";

const artistId = parseInt(process.argv[2]);

if (!artistId) {
  throw new Error("You must provide an artist id to start the script");
}

new BandMap(artistId);
