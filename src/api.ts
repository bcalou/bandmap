import { ZodObject } from "zod";
import { DELAY } from "./env";
import { logError } from "./log";
import { Artist, ArtistReleases, Release, Versions } from "./types";

const API_URL = "https://api.discogs.com";

export function fetchResource<ReturnType>(
  url: string,
  type: ZodObject,
): Promise<ReturnType> {
  return fetch(url)
    .then((res) => res.json())
    .catch(logError)
    .then(async (artist) => {
      type.parse(artist);
      await new Promise((_) => setTimeout(_, DELAY));
      return artist;
    });
}

export function fetchArtist(id: number): Promise<Artist> {
  return fetchResource(`${API_URL}/artists/${id}`, Artist);
}

export function fetchArtistReleases(
  artistId: number,
  page?: number,
): Promise<ArtistReleases> {
  return fetchResource(
    `${API_URL}/artists/${artistId}/releases?per-page=100${
      page ? `&page=${page}` : ""
    }`,
    ArtistReleases,
  );
}

export function fetchRelease(id: number): Promise<Release> {
  return fetchResource(`${API_URL}/releases/${id}`, Release);
}

export function fetchVersions(
  masterId: number,
  page?: number,
): Promise<Versions> {
  return fetchResource(
    `${API_URL}/masters/${masterId}/versions?per-page=100${
      page ? `&page=${page}` : ""
    }`,
    Versions,
  );
}
