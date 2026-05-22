export const DELAY = 2000;
export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease", "Mixed By"],
};

export const EXTRA_ARTIST_ROLES = {
  accept: ["Written-By", "Producer", "Arranged By"],
};

export const FORMATS = {
  accept: ["Album", "EP"],
  reject: [
    "Blu-ray-R",
    "Compilation",
    "DVD",
    "DVDr",
    "Limited Edition",
    "Promo",
    "Single",
  ],
};
