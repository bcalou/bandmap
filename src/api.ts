import { ZodObject } from "zod";
import { logError } from "./log";
import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCVersions,
} from "./types";

export const DELAY = 3000;
const API_URL = "https://api.discogs.com";

export function fetchResource<ReturnType>(
  url: string,
  type: ZodObject
): Promise<ReturnType> {
  return fetch(url)
    .then((res) => res.json())
    .catch(logError)
    .then(async (res) => {
      type.parse(res);
      await new Promise((_) => setTimeout(_, DELAY));
      return res;
    });
}

export function fetchArtist(id: number): Promise<DCArtist> {
  return fetchResource(`${API_URL}/artists/${id}`, DCArtist);
}

export function fetchArtistReleases(
  artistId: number,
  page?: number
): Promise<DCArtistReleases> {
  return fetchResource(
    `${API_URL}/artists/${artistId}/releases?per_page=100${
      page ? `&page=${page}` : ""
    }`,
    DCArtistReleases
  );
}

export function fetchRelease(id: number): Promise<DCRelease> {
  return fetchResource(`${API_URL}/releases/${id}`, DCRelease);
}

export function fetchMaster(id: number): Promise<DCMaster> {
  return fetchResource(`${API_URL}/masters/${id}`, DCMaster);
}

export function fetchVersions(
  masterId: number,
  page?: number
): Promise<DCVersions> {
  return fetchResource(
    `${API_URL}/masters/${masterId}/versions?per-page=100${
      page ? `&page=${page}` : ""
    }`,
    DCVersions
  );
}
