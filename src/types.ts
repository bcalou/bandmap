import z from "zod";

// A simple alias: a reject reason is simply a string
export type RejectReason = string;

export type DCPagination = z.infer<typeof DCPagination>;
export const DCPagination = z.object({
  items: z.number(),
  pages: z.number(),
});

export type DCAlias = z.infer<typeof DCAlias>;
export const DCAlias = z.object({
  id: z.number(),
  name: z.string(),
});

export type DCGroup = z.infer<typeof DCGroup>;
export const DCGroup = z.object({
  id: z.number(),
  name: z.string(),
  resource_url: z.string(),
});

export type DCMember = z.infer<typeof DCMember>;
export const DCMember = z.object({
  id: z.number(),
  name: z.string(),
  resource_url: z.string(),
});

export type DCArtist = z.infer<typeof DCArtist>;
export const DCArtist = z.object({
  aliases: z.array(DCAlias).optional(),
  groups: z.array(DCGroup).optional(),
  id: z.number(),
  members: z.array(DCMember).optional(),
  name: z.string(),
  uri: z.string(),
});

export type DCArtistRelease = z.infer<typeof DCArtistRelease>;
export const DCArtistRelease = z.object({
  artist: z.string(),
  id: z.number(),
  main_release: z.number().optional(),
  role: z.string(),
  title: z.string(),
  type: z.literal(["master", "release"]),
  year: z.number().optional(),
});

export type DCArtistReleases = z.infer<typeof DCArtistReleases>;
export const DCArtistReleases = z.object({
  pagination: DCPagination,
  releases: z.array(DCArtistRelease),
});

export type DCExtraArtist = z.infer<typeof DCExtraArtist>;
export const DCExtraArtist = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
});

export type DCFormat = z.infer<typeof DCFormat>;
export const DCFormat = z.object({
  descriptions: z.array(z.string()).or(z.null()),
  name: z.string(),
});

export type DCTrack = z.infer<typeof DCTrack>;
export const DCTrack = z.object({
  artists: z.array(z.object({ id: z.number() })).optional(),
  extraartists: z.array(DCExtraArtist).optional(),
  position: z.string(),
  get sub_tracks() {
    // Self referencing type using a getter
    return z.array(DCTrack).optional();
  },
  title: z.string(),
  type_: z.string(),
});

export type DCRelease = z.infer<typeof DCRelease>;
export const DCRelease = z.object({
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
  country: z.string().or(z.null()),
  extraartists: z.array(DCExtraArtist).optional(),
  formats: z.array(DCFormat),
  genres: z.array(z.string()).optional(),
  id: z.number(),
  master_id: z.number().optional(),
  master_url: z.string().optional(),
  released: z.string().optional(),
  resource_url: z.string(),
  title: z.string(),
  tracklist: z.array(DCTrack),
  uri: z.string(),
  year: z.number(),
});

export type DCMaster = z.infer<typeof DCMaster>;
export const DCMaster = z.object({
  artists: z.array(z.object({ id: z.number(), name: z.string() })),
  genres: z.array(z.string()).optional(),
  id: z.number(),
  main_release: z.number(),
  title: z.string(),
});

export type DCVersion = z.infer<typeof DCVersion>;
export const DCVersion = z.object({
  country: z.string().or(z.null()),
  format: z.string(),
  id: z.number(),
  major_formats: z.array(z.string()),
  released: z.string().optional(),
});

export type DCVersions = z.infer<typeof DCVersions>;
export const DCVersions = z.object({
  pagination: DCPagination,
  versions: z.array(DCVersion),
});
