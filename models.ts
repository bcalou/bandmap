import * as z from "zod";

export type Artist = z.infer<typeof Artist>;
export const Artist = z.object({
  id: z.number(),
  name: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type ArtistReleases = z.infer<typeof ArtistReleases>;
export const ArtistReleases = z.object({
  releases: z.array(
    z.object({
      id: z.number(),
      main_release: z.number().optional(),
      role: z.literal(
        [
          "Main",
          "Appearance",
          "TrackAppearance",
          "UnofficialRelease",
          "Producer",
        ],
        { error: (iss) => `role "${iss.input}" not listed` },
      ),
    }),
  ),
});

export type Release = z.infer<typeof Release>;
export const Release = z.object({
  id: z.number(),
  released: z.string().optional(),
  formats: z
    .array(
      z.object({
        descriptions: z.array(
          z.literal(
            ["Single", "Album", "Unofficial Release", "Stereo", "EP", "LP"],
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
