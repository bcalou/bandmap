import { ArtistManager } from "./classes/Artist";
import {
  BLACK_COUNTRY_NEW_ROAD,
  MOON_SAFARI,
  refs,
  THE_DEAR_HUNTER,
} from "./refs";

function test(ref: { id: number; expectedIdList: string }) {
  new ArtistManager(ref.id, ref.expectedIdList);
}

test(refs.MOON_SAFARI);
