export const OPTION_INCLUDE_CONNECTED_RELEASES = false;

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  accept: ["Album"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "DVD",
    "DVDr",
    "DVD-Video",
    "Limited Edition",
    "Unofficial Release",
    "VHS",
  ],
  eliminatory: ["Single", "Maxi-Single"],
};

export const GENRES = {
  reject: ["Non-Music"],
};

export const ROLES = {
  rejectIfOnly: [
    "Composed-By",
    "Composed By",
    "Interviewee",
    "Lyrics-By",
    "Lyrics By",
    "Written-By",
    "Written By",
  ],
};
