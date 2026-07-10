import { BandMap } from "./classes/BandMap";
import { refs } from "./refs";

// new BandMap(
//   refs.BLACK_COUNTRY_NEW_ROAD.id,
//   refs.BLACK_COUNTRY_NEW_ROAD.expectedIdList,
// );

const testArtists = [
  refs.BLACK_COUNTRY_NEW_ROAD,
  // refs.HAKEN,
  // refs.MOON_SAFARI,
  // refs.SUPERTRAMP,
];

testArtists.forEach((testArtist) => {
  new BandMap(testArtist.id, testArtist.expectedIdList);
});
