import * as z from "zod";

export type Album = {
  mainRelease: Release;
  master: Master;
};

export type Artist = z.infer<typeof Artist>;
export const Artist = z.object({
  id: z.number(),
  name: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type ArtistRelease = z.infer<typeof ArtistRelease>;
export const ArtistRelease = z.object({
  id: z.number(),
  title: z.string(),
  main_release: z.number().optional(),
  role: z.literal(
    ["Main", "Appearance", "TrackAppearance", "UnofficialRelease", "Producer"],
    { error: (iss) => `role "${iss.input}" not listed` },
  ),
});

export type ArtistReleases = z.infer<typeof ArtistReleases>;
export const ArtistReleases = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  releases: z.array(ArtistRelease),
});

export type Release = z.infer<typeof Release>;
export const Release = z.object({
  id: z.number(),
  released: z.string().optional(),
  artists: z.array(z.object({ id: z.number() })),
  extraartists: z
    .array(z.object({ id: z.number(), role: z.string() }))
    .optional(),
  formats: z
    .array(
      z.object({
        descriptions: z.array(
          z.literal(
            [
              "33 ⅓ RPM",
              "45 RPM",
              '7"',
              "AIFF",
              "Album",
              "Compilation",
              "Deluxe Edition",
              "EP",
              "FLAC",
              "LP",
              "Limited Edition",
              "Numbered",
              "Mixtape",
              "MP3",
              "Reissue",
              "Single",
              "Single Sided",
              "Stereo",
              "Unofficial Release",
              "WAV",
            ],
            {
              error: (iss) => `description "${iss.input}" not listed`,
            },
          ),
        ),
      }),
    )
    .length(1),
});

export type Master = z.infer<typeof Master>;
export const Master = z.object({
  id: z.number(),
  year: z.number(),
});
