import { DateQuality } from "./classes/ReleaseDate";

export const OPTION_INCLUDE_CONNECTED_RELEASES = false;
export const OPTION_TITLE_SIMILARITY_THRESHOLD = 0.66;
export const OPTION_DATE_QUALITY = DateQuality.MonthOnly;
export const OPTION_FORMATS_PRIORITY = [
  "Compilation",
  "EP",
  "Maxi-Single",
  "Single",
  "Unknown",
  "Album",
];

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  mainSortedByConsiderationOrder: [
    "Compilation",
    "EP",
    "Maxi-Single",
    "Single",
    "Unknown",
    "Album", // Album is last because if it's anything else (like Compilation),
    // then it's not really an album
  ],
  reject: [
    "4-Track Cartridge",
    "8-Track Cartridge",
    "Acetate",
    "Beta ED",
    "Betacam SP",
    "Betacam",
    "Betamax",
    "Blu-ray-R",
    "Blu-ray",
    "Box Set",
    "Cartrivision",
    "Cassette",
    "CDr",
    "CDV",
    "Cylinder",
    "DAT",
    "DC-International",
    "DCC",
    "DVD-Video",
    "DVD",
    "DVDr",
    "Edison Disc",
    "Elcaset",
    "Enhanced",
    "File",
    "Film Reel",
    "Flexi-disc",
    "Floppy Disk",
    "HD DVD-R",
    "HD DVD",
    "HitClips",
    "Laserdisc",
    "Lathe Cut",
    "Limited Edition",
    "Memory Stick",
    "Microcassette",
    "Mighty Tiny",
    "Minidisc",
    "MiniDV",
    "MVD",
    "NT Cassette",
    "Pathé Disc",
    "PlayTape",
    "Pocket Rocker",
    "Promo",
    "RCA Tape Cartridge",
    "Reel-To-Reel",
    "Reel-To-Reel",
    "Reissue",
    "Remastered",
    "Revere Magnetic Stereo Tape Ca",
    "Sabamobil",
    "SACD",
    "SelectaVision",
    "Shellac",
    "Sopic",
    "Super Beta",
    "Super VHS",
    "TeD",
    "Tefifon",
    "Test Pressing",
    "Tour Recording",
    "Transcription",
    "U-matic",
    "Ultra HD Blu-ray",
    "UMD",
    "Unofficial Release",
    "VHD",
    "VHS",
    "Video 2000",
    "Video8",
    "Wire Recording",
    "Zip Disk",
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

export const IGNORE_TITLE_ENDINGS = ["Edit", "Version", "Untitled"];
