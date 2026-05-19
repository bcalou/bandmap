import { Artist, ArtistReleases, Master, Release } from "./models";

const API_URL = "https://api.discogs.com";

const roles = {
  include: ["Written-By", "Producer", "Arranged By"],
  exlude: ["Sleeves Notes"],
};

// let band: Band;
const releases: any = [];

function fetchArtist(id: number): Promise<Artist> {
  return fetch(`${API_URL}/artists/${id}`).then((res) => res.json());
}

function fetchArtistReleases(id: number): Promise<ArtistReleases> {
  return fetch(`${API_URL}/artists/${id}/releases`).then((res) => res.json());
}

function fetchRelease(id: number): Promise<Release> {
  return fetch(`${API_URL}/releases/${id}`).then((res) => res.json());
}

function fetchMaster(id: number): Promise<Master> {
  return fetch(`${API_URL}/masters/${id}`).then((res) => res.json());
}

// fetchArtist(733171).then((artist) => {
//   console.log(artist);
//   Artist.parse(artist);
// });

fetchArtistReleases(733171).then(async (artistReleases) => {
  ArtistReleases.parse(artistReleases);

  for (const release of artistReleases.releases) {
    if (
      release.main_release &&
      !releases.find((_release: any) => _release.id === release.id)
    ) {
      const mainRelease = await fetchRelease(release.main_release);
      Release.parse(mainRelease);

      if (!mainRelease.formats[0].descriptions.includes("Single")) {
        releases.push(mainRelease);
      }
    }
  }
  console.log(artistReleases);
});

// fetchRelease(8557933).then((res) => Release.parse(res));
// fetchMaster(13318111).then(console.log);
// fetchArtist(1560698).then(console.log)
