import z from "zod";

export type Artist = z.infer<typeof Artist>;
export const Artist = z.object({
  id: z.number(),
  name: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  groups: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  aliases: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
});

export type ArtistRelease = z.infer<typeof ArtistRelease>;
export const ArtistRelease = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  type: z.literal(["master", "release"]),
  main_release: z.number().optional(),
  year: z.number().optional(),
  role: z.literal(
    [
      "Appearance",
      "Co-producer",
      "Main",
      "Mixed by",
      "Producer",
      "Remix",
      "TrackAppearance",
      "UnofficialRelease",
    ],
    { error: (iss) => `role "${iss.input}" not listed` }
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

export type ExtraArtist = z.infer<typeof ExtraArtist>;
export const ExtraArtist = z.object({ id: z.number(), role: z.string() });

export type Release = z.infer<typeof Release>;
export const Release = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
  formats: z.array(
    z.object({
      name: z.string(),
      descriptions: z.array(z.string()),
    })
  ),
  master_id: z.number().optional(),
  released: z.string().optional(),
  extraartists: z.array(ExtraArtist).optional(),
});

export type Master = z.infer<typeof Master>;
export const Master = z.object({
  id: z.number(),
  main_release: z.number(),
  title: z.string(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type Versions = z.infer<typeof Versions>;
export const Versions = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  versions: z.array(
    z.object({
      id: z.number(),
      major_formats: z.array(z.string()),
      format: z.string(),
    })
  ),
});
