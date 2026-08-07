import { DateQuality } from "./classes/discogs/release/ReleaseDate";

// A list of options that can be changed on a per-usage basis
export const OPTIONS = {
  // List of cache keys that should be fetched again
  cacheBuster: [] as string[],
  // Should the program include releases connected to the main artist?
  includeConnectedReleases: false,
  // Threshold below which two strings are considered to be the same
  stringSimilarityThreshold: 0.2,
  // The target for date precision
  targetDateQuality: DateQuality.MonthOnly,
};
