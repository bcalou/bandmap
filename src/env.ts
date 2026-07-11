import { DateQuality } from "./classes/ReleaseDate";

export const OPTION_INCLUDE_CONNECTED_RELEASES = false;
export const OPTION_TITLE_SIMILARITY_THRESHOLD = 0.66;
export const OPTION_DATE_QUALITY = DateQuality.MonthOnly;
export const OPTION_SECONDARY_FORMATS_LOOKUP_ORDER = [
  "Compilation",
  "EP",
  "Maxi-Single",
  "Single",
  "Unknown",
];

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  main: ["Album", "EP", "Compilation", "Maxi-Single", "Single"],
  reject: [
    "Blu-ray",
    "Blu-ray-R",
    "Box Set",
    "Cassette",
    "CDr",
    "DVD",
    "DVDr",
    "DVD-Video",
    "File",
    "Flexi-disc",
    "Limited Edition",
    "Promo",
    "Reel-To-Reel",
    "Reissue",
    "Remastered",
    "Test Pressing",
    "Tour Recording",
    "Transcription",
    "Unofficial Release",
    "VHS",
  ],
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
