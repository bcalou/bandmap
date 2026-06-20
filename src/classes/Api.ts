import { ZodObject } from "zod";
import { logError } from "../log";
import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCSearch,
  DCVersions,
} from "../types";
import * as Discogs from "disconnect";

// var discogs = new Client({
//   consumerKey: "KjrpvorlXakACBzWYgvl",
//   consumerSecret: "CggkIagphcuYfzlkoqElKiVtyyNsYZMR",
// });

export const DELAY = 3000;
export const PER_PAGE = 100;
const API_URL = "https://api.discogs.com";

export class Api {
  static instance: Api;
  private database: any;

  constructor() {
    if (!!Api.instance) {
      return Api.instance;
    }

    Api.instance = this;

    this.database = new Discogs.Client({
      consumerKey: "KjrpvorlXakACBzWYgvl",
      consumerSecret: "CggkIagphcuYfzlkoqElKiVtyyNsYZMR",
    }).database();
  }

  // Search the discogs database
  public search(options: {
    artist?: string;
    country?: string;
    format?: "album" | "ep";
  }): Promise<DCSearch> {
    return this.database
      .search("", {
        ...options,
        type: "release",
        per_page: 100,
      })
      .then(function (results: any) {
        DCSearch.parse(results);
        return results;
      });
  }
}

function fetchResource<ReturnType>(
  url: string,
  type: ZodObject
): Promise<ReturnType> {
  return fetch(url)
    .then((res) => res.json())
    .catch(logError)
    .then((res) => handleResponse(res, type, url));
}

async function handleResponse<ReturnType>(
  res: any,
  type: ZodObject,
  url: string
): Promise<ReturnType> {
  try {
    type.parse(res);
  } catch (error) {
    logError(`Failed to fetch ${url}`);
    throw error;
  }

  await new Promise((_) => setTimeout(_, DELAY));
  return res;
}

export function fetchArtist(id: number): Promise<DCArtist> {
  return fetchResource(`${API_URL}/artists/${id}`, DCArtist);
}

export function fetchArtistReleases(
  artistId: number,
  page?: number
): Promise<DCArtistReleases> {
  return fetchResource(
    `${API_URL}/artists/${artistId}/releases?per_page=${PER_PAGE}${
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
    `${API_URL}/masters/${masterId}/versions?per_page=${PER_PAGE}${
      page ? `&page=${page}` : ""
    }`,
    DCVersions
  );
}
