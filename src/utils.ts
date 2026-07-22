import { OPTION_TITLE_SIMILARITY_THRESHOLD } from "./env";

var stringSimilarity = require("string-similarity");

// Remove the number in parenthesis at the end of a string
// "John Doe (3)" -> "John Doe"
export function removeNumberInParenthesis(string: string) {
  return string.replace(/\s*\(\d+\)$/, "");
}

export function stringsAreSimilar(string1: string, string2: string): boolean {
  return (
    stringSimilarity.compareTwoStrings(string1, string2) >
    OPTION_TITLE_SIMILARITY_THRESHOLD
  );
}

// Split a complexe string into several parts
// "Track title - some details / again (other details)"
// -> ["Track title", "some details", "again", "other details"]
export function getStringParts(string: string) {
  return string
    .split(/\s[-\/]|[{}():[\]]/g)
    .filter(Boolean)
    .map(normalize);
}

// Remove any special character except spaces and convert to lowercase
// "John's Doe" -> "john doe"
export function normalize(string: string) {
  return string
    .replace(/[^a-zA-Z ]/g, "")
    .replaceAll("&", "and")
    .toLowerCase();
}
