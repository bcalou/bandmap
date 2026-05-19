import { ZodObject } from "zod";
import { Artist, ArtistReleases, Master, Release } from "./models";

const API_URL = "https://api.discogs.com";

export function fetchResource<ReturnType>(
  url: string,
  type: ZodObject
): Promise<ReturnType> {
  return fetch(url)
    .then((res) => res.json())
    .then((artist) => {
      type.parse(artist);
      return artist;
    });
}

export function fetchArtist(id: number): Promise<Artist> {
  return fetchResource(`${API_URL}/artists/${id}`, Artist);
}

export function fetchArtistReleases(id: number): Promise<ArtistReleases> {
  return fetchResource(`${API_URL}/artists/${id}/releases`, ArtistReleases);
}

export function fetchRelease(id: number): Promise<Release> {
  return fetchResource(`${API_URL}/releases/${id}`, Release);
}

export function fetchMaster(id: number): Promise<Master> {
  return fetchResource(`${API_URL}/masters/${id}`, Master);
}
