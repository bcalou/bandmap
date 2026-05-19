import {
  fetchArtist,
  fetchArtistReleases,
  fetchMaster,
  fetchRelease,
} from "./api";
import { log, logError, logSeparator, logSuccess, logWarning } from "./log";
import { Album, Artist, ArtistRelease } from "./models";

const DELAY = 3000;
const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";

const roles = {
  include: ["Written-By", "Producer", "Arranged By"],
  exlude: ["Sleeves Notes"],
};

let artist: Artist;
const albums: Album[] = [];

async function init(artistId: number) {
  artist = await fetchArtist(artistId);

  logSuccess(`Fetched artist ${artist.id}: "${artist.name}"`);

  const artistReleases = await fetchArtistReleases(artistId);

  if (artistReleases.pagination.pages > 1) {
    throw new Error("Multiple page not handled yet!");
  }

  logSuccess(`${artistReleases.pagination.items} release(s) fetched`);

  for (const artistRelease of artistReleases.releases) {
    await handleArtistRelease(artistRelease);
  }
}

async function handleArtistRelease(artistRelease: ArtistRelease) {
  logSeparator();
  log(
    `Analyzing release ${artistRelease.id}${
      artistRelease.main_release
        ? ` (${DISCOGS_RELEASE_URL}${artistRelease.main_release})`
        : ""
    }`
  );

  if (albums.find((album) => album.master.id === artistRelease.id)) {
    log(`↷ "${artistRelease.title}" (skipping, already included)`);
    return;
  }

  if (!artistRelease.main_release) {
    logWarning(`❌ "${artistRelease.title}" (no main release)`);
    return;
  }

  if (["TrackAppearance"].includes(artistRelease.role)) {
    logWarning(`❌ "${artistRelease.title}" (role: ${artistRelease.role})`);
    return;
  }

  const mainRelease = await fetchRelease(artistRelease.main_release);

  if (mainRelease.formats[0].descriptions.indexOf("Single") > -1) {
    logWarning(`❌ "${artistRelease.title}" (single)`);
    return;
  }

  const master = await fetchMaster(artistRelease.id);
  logSuccess(`✓ "${artistRelease.title}"`);

  albums.push({ mainRelease, master });
  await new Promise((_) => setTimeout(_, DELAY));
}

init(6959133);
