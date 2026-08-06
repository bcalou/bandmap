import { BandMap } from "./classes/BandMap";
import { tests } from "./tests";

function testArtist(artist: { id: number; expectedIdList?: string }) {
  new BandMap(artist.id, artist.expectedIdList).init();
}

const artistsBase = [
  // refs.BLACK_COUNTRY_NEW_ROAD,
  // refs.ECHOLYN,
  // refs.HAKEN,
  // refs.MOON_SAFARI,
  tests.SUPERTRAMP,
];

async function init() {
  for (const artist of artistsBase) {
    await new BandMap(artist.id, artist.expected).init();
  }
}

init();
