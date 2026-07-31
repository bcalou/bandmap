import { BandMap } from "./classes/BandMap";

function testArtist(artist: { id: number; expectedIdList?: string }) {
  new BandMap(artist.id, artist.expectedIdList).init();
}

// YES
// new BandMap(50263).init();

// PF
// new BandMap(45467).init();

// TRANSATLANTIC
// new BandMap(303573).init();

// ELO
// new BandMap(112154).init();

testArtist({ id: 1092029 });

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
