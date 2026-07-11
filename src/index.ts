import { Band } from "./classes/Band";
import { BandMap } from "./classes/BandMap";
import { refs } from "./refs";

function testArtists(artist: { id: number; expectedIdList: string }) {
  new BandMap(artist.id, artist.expectedIdList);
}

// new BandMap(732043);

testArtists(refs.ECHOLYN);

// testArtists.forEach((testArtist) => {
//   new BandMap(testArtist.id, testArtist.expectedIdList);
// });
