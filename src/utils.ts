import { OPTION_TITLE_SIMILARITY_THRESHOLD } from "./env";

var stringSimilarity = require("string-similarity");

// Remove the number in parenthesis at the end of a string
// "John Doe (3)" -> "John Doe"
export function removeNumberInParenthesis(string: string) {
  return string.replace(/\s*\(\d+\)$/, "");
}

// Convert details from a string
// Track title (details) -> Track title
// Track title - details -> Track title
export function removeDetails(string: string) {
  return string.replace(/\s*[\(\{\[].*?[\)\}\]]\s*/g, "").split(" - ")[0];
}

// Remove any special character except spaces and convert to lowercase
// "John's Doe" -> "john doe"
export function normalize(string: string) {
  return string.replace(/[^a-zA-Z ]/g, "").toLowerCase();
}

export function stringsAreSimilar(string1: string, string2: string): boolean {
  return (
    stringSimilarity.compareTwoStrings(string1, string2) >
    OPTION_TITLE_SIMILARITY_THRESHOLD
  );
}
