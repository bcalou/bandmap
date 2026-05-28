import { ArtistManager } from "./classes/Artist";
import { refs } from "./refs";

function test(ref: { id: number; expectedIdList?: string }) {
  new ArtistManager(ref.id, ref.expectedIdList);
}

test(refs.ANTHON_JOHANSSON);
