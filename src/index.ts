import { BandMap } from "./classes/BandMap";
import { refs } from "./refs";

function testArtist(artist: { id: number; expectedIdList: string }) {
  new BandMap(artist.id, artist.expectedIdList).init();
}

new BandMap(50263).init();

// testArtist(refs.SUPERTRAMP);

// const artistsBase = [
//   refs.BLACK_COUNTRY_NEW_ROAD,
//   refs.ECHOLYN,
//   refs.HAKEN,
//   refs.MOON_SAFARI,
//   refs.SUPERTRAMP,
// ];

// async function init() {
//   for (const artist of artistsBase) {
//     await new BandMap(artist.id, artist.expectedIdList).init();
//   }
// }

// init();
