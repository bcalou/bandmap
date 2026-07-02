import { OPTION_TITLE_SIMILARITY_THRESHOLD } from "./env";

var stringSimilarity = require("string-similarity");

// Remove the number in parenthesis at the end of a string
// "John Doe (3)" -> "John Doe"
export function clean(string: string) {
  return string.replace(/\s*\(\d+\)$/, "");
}

export function stringsAreSimilar(string1: string, string2: string): boolean {
  return (
    stringSimilarity.compareTwoStrings(string1, string2) >
    OPTION_TITLE_SIMILARITY_THRESHOLD
  );
}
