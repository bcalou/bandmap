import z from "zod";

export type ArtistModel = z.infer<typeof ArtistModel>;
export const ArtistModel = z.object({
  id: z.number(),
  name: z.string(),
  resource_url: z.string(),
  members: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  groups: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  aliases: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    )
    .optional(),
});

export type ArtistReleaseModel = z.infer<typeof ArtistReleaseModel>;
export const ArtistReleaseModel = z.object({
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
    { error: (iss) => `role "${iss.input}" not listed` },
  ),
});

export type ArtistReleasesModel = z.infer<typeof ArtistReleasesModel>;
export const ArtistReleasesModel = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  releases: z.array(ArtistReleaseModel),
});

export type ExtraArtistModel = z.infer<typeof ExtraArtistModel>;
export const ExtraArtistModel = z.object({ id: z.number(), role: z.string() });

export type ReleaseModel = z.infer<typeof ReleaseModel>;
export const ReleaseModel = z.object({
  id: z.number(),
  title: z.string(),
  year: z.number(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
  formats: z.array(
    z.object({
      name: z.string(),
      descriptions: z.array(z.string()),
    }),
  ),
  master_id: z.number().optional(),
  released: z.string().optional(),
  extraartists: z.array(ExtraArtistModel).optional(),
});

export type MasterModel = z.infer<typeof MasterModel>;
export const MasterModel = z.object({
  id: z.number(),
  main_release: z.number(),
  title: z.string(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type VersionsModel = z.infer<typeof VersionsModel>;
export const VersionsModel = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  versions: z.array(
    z.object({
      id: z.number(),
      major_formats: z.array(z.string()),
      format: z.string(),
    }),
  ),
});
