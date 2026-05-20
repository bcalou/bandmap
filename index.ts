import {
  fetchArtist,
  fetchArtistReleases,
  fetchMaster,
  fetchRelease,
} from "./api";
import { log, logSeparator, logSuccess, logWarning } from "./log";
import { Album, Artist, ArtistRelease, Release } from "./models";
import { MOON_SAFARI } from "./refs";

const DELAY = 2000;
const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";

const ROLES = {
  include: ["Written-By", "Producer", "Arranged By"],
};

const FORMATS = {
  include: ["Album", "EP"],
  exclude: ["Compilation", "Promo"],
};

let artist: Artist;
const releases: Release[] = [];

async function init(artistId: number) {
  artist = await fetchArtist(artistId);

  logSuccess(`Fetched artist ${artist.id}: "${artist.name}"`);

  const artistReleases = await fetchArtistReleases(artistId);

  if (artistReleases.pagination.pages > 1) {
    throw new Error("Multiple page not handled yet!");
  }

  logSuccess(`${artistReleases.pagination.items} release(s) fetched`);

  for (const artistRelease of artistReleases.releases) {
    await handleArtistRelease(artistRelease, artistId);
  }

  releases.sort((release1, release2) =>
    getReleaseDate(release1).localeCompare(getReleaseDate(release2))
  );

  logSeparator();
  log("CHRONOLOGICAL DISCOGRAPHY:");
  logSeparator();
  releases.forEach((release) => {
    logSuccess(
      `${getReleaseDate(release)}${
        release.artists[0].id !== artistId
          ? ` - ${release.artists[0].name}`
          : ""
      } - ${release.title} (${getReleaseUrl(release)})`
    );
  });
}

async function handleArtistRelease(
  artistRelease: ArtistRelease,
  artistId: number
) {
  logSeparator();
  log(
    `Analyzing artist release ${artistRelease.id} (${getArtistReleaseUrl(
      artistRelease
    )})`
  );

  if (releases.find((release) => release.id === artistRelease.main_release)) {
    log(`↷ "${artistRelease.title}" (skipping, already included)`);
    return;
  }

  if (["TrackAppearance", "UnofficialRelease"].includes(artistRelease.role)) {
    logWarning(`❌ "${artistRelease.title}" (role: ${artistRelease.role})`);
    return;
  }

  const mainRelease = await getMainRelease(artistRelease, artistId);

  if (!mainRelease) {
    return;
  }

  logSuccess(`✓ "${artistRelease.title}"`);
  releases.push(mainRelease);
}

async function getMainRelease(
  artistRelease: ArtistRelease,
  artistId: number
): Promise<Release | null> {
  const mainRelease = await fetchRelease(
    artistRelease.main_release ?? artistRelease.id
  );

  await new Promise((_) => setTimeout(_, DELAY));

  const formats = getReleaseFormats(mainRelease);

  if (
    !formats.find((format) => FORMATS.include.includes(format)) ||
    formats.find((format) => FORMATS.exclude.includes(format))
  ) {
    logWarning(`❌ "${artistRelease.title}" (formats: ${formats.join(", ")})`);
    return null;
  }

  if (!isMainArtist(mainRelease, artist)) {
    const roles = getReleaseRolesAsExtraArtist(mainRelease, artistId);
    if (!roles.find((role) => ROLES.include.includes(role))) {
      logWarning(`❌ "${artistRelease.title}" (role(s): ${roles})`);
      return null;
    }
  }

  return mainRelease;
}

function getReleaseDate(release: Release): string {
  return release.released ?? release.year.toString();
}

function getArtistReleaseUrl(artistRelease: ArtistRelease) {
  return `${DISCOGS_RELEASE_URL}${
    artistRelease.main_release ?? artistRelease.id
  }`;
}

function getReleaseUrl(release: Release) {
  return `${DISCOGS_RELEASE_URL}${release.id}`;
}

function isMainArtist(release: Release, artist: Artist) {
  return release.artists.find((_artist) => _artist.id === artist.id);
}

function getReleaseFormats(release: Release) {
  return release.formats.reduce(
    (allFormats: string[], format) => [...allFormats, ...format.descriptions],
    []
  );
}

function getReleaseRolesAsExtraArtist(
  release: Release,
  artistId: number
): string[] {
  return (
    release.extraartists
      ?.filter((extraArtist) => extraArtist.id === artistId)
      .map((role) => role.role) ?? []
  );
}

init(MOON_SAFARI);
