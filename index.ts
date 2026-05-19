import {
  fetchArtist,
  fetchArtistReleases,
  fetchMaster,
  fetchRelease,
} from "./api";
import { Album, Artist, ArtistReleases, Master, Release } from "./models";

const roles = {
  include: ["Written-By", "Producer", "Arranged By"],
  exlude: ["Sleeves Notes"],
};

// let band: Band;

let artist: Artist;
const albums: Album[] = [];

async function init(artistId: number) {
  artist = await fetchArtist(artistId);

  console.info(`Fetched artist ${artist.id}: "${artist.name}"`);

  const artistReleases = await fetchArtistReleases(artistId);

  if (artistReleases.pagination.pages > 1) {
    throw new Error("Multiple page not handled yet!");
  }

  console.info(`${artistReleases.pagination.items} release(s) fetched`);

  for (const release of artistReleases.releases) {
    console.info(`Analyzing release ${release.id}: "${release.title}"`);

    if (!release.main_release) {
      console.info(`Reject: no main release`);
      continue;
    }

    const mainRelease = await fetchRelease(release.main_release);

    if (mainRelease.formats[0].descriptions.indexOf("Single") > -1) {
      console.info(`Reject: Single`);
      continue;
    }

    const master = await fetchMaster(release.id);
    console.info(`Accept`);

    albums.push({ mainRelease, master });
  }
}

init(17379355);

// fetchArtistReleases(17379355).then(async (artistReleases) => {
//   for (const release of artistReleases.releases) {
//     if (
//       release.main_release &&
//       !albums.find((album) => album.mainRelease.id === release.main_release)
//     ) {
//       const mainRelease = await fetchRelease(release.main_release);
//       const master = await fetchMaster(release.id);

//       if (mainRelease.formats[0].descriptions.indexOf("Single") === -1) {
//         albums.push({
//           mainRelease,
//           master,
//         });
//       }
//     }
//   }

//   console.log(albums);
// });

// fetchRelease(8557933).then((res) => Release.parse(res));
// fetchMaster(13318111).then(console.log);
// fetchArtist(1560698).then(console.log)
