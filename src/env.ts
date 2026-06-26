export const OPTION_INCLUDE_CONNECTED_RELEASES = false;

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  accept: ["Album", "EP"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "DVD",
    "DVDr",
    "DVD-Video",
    "Limited Edition",
    "Unofficial Release",
  ],
  eliminatory: ["Compilation", "Single", "Maxi-Single"],
};

export const ROLES = {
  rejectIfOnly: [
    "Written-By",
    "Written By",
    "Composed-By",
    "Composed By",
    "Lyrics-By",
    "Lyrics By",
  ],
};
