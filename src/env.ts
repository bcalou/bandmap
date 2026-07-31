import { DateQuality } from "./classes/ReleaseDate";

export const OPTION_CACHE_BUSTER: string[] = ["release_9182986"];
export const OPTION_INCLUDE_CONNECTED_RELEASES = false;
export const OPTION_TITLE_SIMILARITY_THRESHOLD = 0.66;
export const OPTION_DATE_QUALITY = DateQuality.MonthOnly;

export const DISCOGS_RELEASE_URL = "https://www.discogs.com/release/";
export const DISCOGS_MASTER_URL = "https://www.discogs.com/master/";
export const DISCOGS_ARTIST_URL = "https://www.discogs.com/artist/";

export const ARTIST_RELEASE_ROLES = {
  reject: ["TrackAppearance", "UnofficialRelease"],
};

export const FORMATS = {
  mainSortedByConsiderationOrder: [
    "Single",
    "Maxi-Single",
    "EP",
    "Compilation",
    "Unknown",
    "Album", // Album is last because if it's anything else (like Compilation),
    // then it's not really an album
  ],
  accept: ["CD", "Vinyl"],
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
    "CD-ROM",
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
    "File",
    "Film Reel",
    "Flexi-disc",
    "Floppy Disk",
    "HD DVD-R",
    "HD DVD",
    "HitClips",
    "Laserdisc",
    "Lathe Cut",
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
    "U-matic",
    "Ultra HD Blu-ray",
    "UMD",
    "VHD",
    "VHS",
    "Video 2000",
    "Video8",
    "Wire Recording",
    "Zip Disk",
  ],
  eliminatory: [
    "Club Edition",
    "Enhanced",
    "Transcription",
    "Limited Edition",
    "Mispress",
    "Promo",
    "Record Store Day",
    "Reissue",
    "Remixed",
    "Repress",
    "Test Pressing",
    "Tour Recording",
    "Unofficial Release",
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

export const IGNORE_TITLE_ENDINGS = [
  "Bonus Video",
  "Documentary",
  "Edit",
  "Ending",
  "Medley",
  "Mix",
  "Solo",
  "Version",
  "Untitled",
];
