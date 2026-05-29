import { ZodObject } from "zod";
import { logError } from "./log";
import {
  ArtistModel,
  ArtistReleasesModel,
  MasterModel,
  ReleaseModel,
  VersionsModel,
} from "./types";

export const DELAY = 3000;
const API_URL = "https://api.discogs.com";

export function fetchResource<ReturnType>(
  url: string,
  type: ZodObject,
): Promise<ReturnType> {
  return fetch(url, {
    headers: {
      "User-Agent": "BandMap/0.1",
    },
  })
    .then((res) => res.json())
    .catch(logError)
    .then(async (artist) => {
      type.parse(artist);
      await new Promise((_) => setTimeout(_, DELAY));
      return artist;
    });
}

export function fetchArtist(id: number): Promise<ArtistModel> {
  return fetchResource(`${API_URL}/artists/${id}`, ArtistModel);
}

export function fetchArtistReleases(
  artistId: number,
  page?: number,
): Promise<ArtistReleasesModel> {
  return fetchResource(
    `${API_URL}/artists/${artistId}/releases?per_page=100${
      page ? `&page=${page}` : ""
    }`,
    ArtistReleasesModel,
  );
}

export function fetchRelease(id: number): Promise<ReleaseModel> {
  return fetchResource(`${API_URL}/releases/${id}`, ReleaseModel);
}

export function fetchMaster(id: number): Promise<MasterModel> {
  return fetchResource(`${API_URL}/masters/${id}`, MasterModel);
}

export function fetchVersions(
  masterId: number,
  page?: number,
): Promise<VersionsModel> {
  return fetchResource(
    `${API_URL}/masters/${masterId}/versions?per-page=100${
      page ? `&page=${page}` : ""
    }`,
    VersionsModel,
  );
}
