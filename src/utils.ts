import Fuse from "fuse.js";
import { OPTIONS } from "./options";

// Remove the number in parenthesis at the end of a string
// "John Doe (3)" -> "John Doe"
export function removeNumberInParenthesis(string: string) {
  return string.replace(/\s*\(\d+\)$/, "");
}

// Are the two string similar enough?
export function stringsAreSimilar(string1: string, string2: string): boolean {
  return (
    Fuse.match(string1, string2, {
      threshold: OPTIONS.stringSimilarityThreshold,
    }).isMatch ||
    Fuse.match(string2, string1, {
      threshold: OPTIONS.stringSimilarityThreshold,
    }).isMatch
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
  return string.replace(/[^0-9a-zA-Z ]/g, "").toLowerCase();
}
