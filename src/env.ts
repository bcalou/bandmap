import { DateQuality } from "./classes/ReleaseDate";

export const OPTION_INCLUDE_CONNECTED_RELEASES = false;
export const OPTION_TITLE_SIMILARITY_THRESHOLD = 0.66;
export const OPTION_DATE_QUALITY = DateQuality.MonthOnly;
export const OPTION_SECONDARY_FORMATS_LOOKUP_ORDER = [
  "Compilation",
  "Maxi-Single",
  "Single",
];

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  accept: ["Album", "EP", "Compilation", "Maxi-Single", "Single"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "Cassette",
    "DVD",
    "DVDr",
    "DVD-Video",
    "Limited Edition",
    "Promo",
    "Reel-To-Reel",
    "Reissue",
    "Remastered",
    "Tour Recording",
    "Unofficial Release",
    "VHS",
  ],
  eliminatory: ["Box Set"],
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
