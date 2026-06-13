import z from "zod";
import { Artist } from "./classes/Artist";

export type RejectReason = string;

export type Credit = {
  artist: Artist;
  roles: string[];
};

export type DCMember = z.infer<typeof DCMember>;
export const DCMember = z.object({
  id: z.number(),
  name: z.string(),
  resource_url: z.string(),
});

export type DCGroup = z.infer<typeof DCGroup>;
export const DCGroup = z.object({
  id: z.number(),
  name: z.string(),
  resource_url: z.string(),
});

export type DCAlias = z.infer<typeof DCAlias>;
export const DCAlias = z.object({
  id: z.number(),
  name: z.string(),
});

export type DCArtist = z.infer<typeof DCArtist>;
export const DCArtist = z.object({
  id: z.number(),
  name: z.string(),
  uri: z.string(),
  members: z.array(DCMember).optional(),
  groups: z.array(DCGroup).optional(),
  aliases: z.array(DCAlias).optional(),
});

export type DCArtistRelease = z.infer<typeof DCArtistRelease>;
export const DCArtistRelease = z.object({
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

export type DCArtistReleases = z.infer<typeof DCArtistReleases>;
export const DCArtistReleases = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  releases: z.array(DCArtistRelease),
});

export type DCExtraArtist = z.infer<typeof DCExtraArtist>;
export const DCExtraArtist = z.object({
  id: z.number(),
  role: z.string(),
  name: z.string(),
});

export type DCRelease = z.infer<typeof DCRelease>;
export const DCRelease = z.object({
  id: z.number(),
  title: z.string(),
  resource_url: z.string(),
  uri: z.string(),
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
  extraartists: z.array(DCExtraArtist).optional(),
  tracklist: z.array(
    z.object({
      extraartists: z.array(DCExtraArtist).optional(),
    })
  ),
});

export type DCMaster = z.infer<typeof DCMaster>;
export const DCMaster = z.object({
  id: z.number(),
  main_release: z.number(),
  title: z.string(),
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
});

export type DCVersion = z.infer<typeof DCVersion>;
export const DCVersion = z.object({
  id: z.number(),
  major_formats: z.array(z.string()),
  format: z.string(),
});

export type DCVersions = z.infer<typeof DCVersions>;
export const DCVersions = z.object({
  pagination: z.object({
    pages: z.number(),
    items: z.number(),
  }),
  versions: z.array(DCVersion),
});
