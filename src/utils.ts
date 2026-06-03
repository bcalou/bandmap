// Remove the number in parenthesis at the end of a string
// "John Doe (3)" -> "John Doe"
export function clean(string: string) {
  return string.replace(/\s*\(\d+\)$/, "");
}
