export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease", "Mixed By"],
};

export const EXTRA_ARTIST_ROLES = {
  // accept: ["Written-By", "Producer", "Arranged By"],
  reject: ["Sleeve Notes"],
};

export const FORMATS = {
  accept: ["Album", "EP"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "Compilation",
    "DVD",
    "DVDr",
    "DVD-Video",
    "Limited Edition",
    "Single",
  ],
};
