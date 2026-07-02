export const OPTION_INCLUDE_CONNECTED_RELEASES = false;
export const OPTION_TITLE_SIMILARITY_CONSIDERED_IDENTICAL = 0.2;

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  accept: ["Album"],
  secondary: ["Compilation"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "Cassette",
    "DVD",
    "DVDr",
    "DVD-Video",
    "Limited Edition",
    "Promo",
    "Reissue",
    "Remastered",
    "Unofficial Release",
    "VHS",
  ],
  eliminatory: ["Box Set", "Single", "Maxi-Single"],
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
