import { ZodObject } from "zod";
import { logError } from "../log";
import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCVersions,
} from "../types";
import * as Discogs from "disconnect";

// var discogs = new Client({
//   consumerKey: "KjrpvorlXakACBzWYgvl",
//   consumerSecret: "CggkIagphcuYfzlkoqElKiVtyyNsYZMR",
// });

export class Api {
  private database: any;

  constructor() {
    this.database = new Discogs.Client({
      consumerKey: "KjrpvorlXakACBzWYgvl",
      consumerSecret: "CggkIagphcuYfzlkoqElKiVtyyNsYZMR",
    }).database();

    this.database.search(
      "",
      {
        artist: "moon safari",
        type: "release",
        country: "sweden",
        per_page: 100,
        format: "album",
      },
      function (err: any, data: any) {
        console.log(JSON.stringify(data));
        console.log(data);
      }
    );
  }

  // Search the discogs database
  public search(options: {
    artist: string;
    country: string;
    format: "album" | "ep";
  }) {
    return this.database
      .search("", {
        ...options,
        type: "release",
        per_page: 100,
      })
      .then(function (results: any) {
        console.log(JSON.parse(results));
        return results;
      });
  }
}

export const DELAY = 3000;
export const PER_PAGE = 100;
const API_URL = "https://api.discogs.com";

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
