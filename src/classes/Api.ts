import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCVersions,
} from "../types";
import * as Discogs from "disconnect";
import Database from "better-sqlite3";
import path from "path";

export const DELAY = 1000;
export const PER_PAGE = 100;
export const API_CONSUMER_KEY = "KjrpvorlXakACBzWYgvl";
export const API_CONSUMER_SECRET = "CggkIagphcuYfzlkoqElKiVtyyNsYZMR";
export const API_CACHE_FILE = "../../discogs_cache.db";

type CacheEntry = {
  key: string;
  value: string;
};

export class Api {
  // The singleton instance
  static instance: Api;

  // The discogs database connector
  private discogs: Discogs.DatabaseAPI;

  // The sqlite cache
  private cache: Database.Database;

  constructor() {
    // Satisfy Typescript instanciation in constructor requirements
    this.cache = Api.instance?.cache;
    this.discogs = Api.instance?.discogs;

    if (!!Api.instance) {
      return Api.instance;
    }

    Api.instance = this;

    this.init();
  }

  public async getArtist(id: number): Promise<DCArtist> {
    const key = `artist_${id}`;

    return this.getCached<DCArtist>(key, () =>
      this.discogs.getArtist(id).then((result: any) => DCArtist.parse(result))
    );
  }

  public async getArtistReleases(
    id: number,
    page = 1
  ): Promise<DCArtistReleases> {
    const key = `artist_releases_${id}_${page}`;
    return this.getCached<DCArtistReleases>(key, () =>
      this.discogs
        .getArtistReleases(id, { page: page, per_page: PER_PAGE })
        .then((result: any) => DCArtistReleases.parse(result))
    );
  }

  public async getRelease(id: number): Promise<DCRelease> {
    const key = `release_${id}`;
    return this.getCached<DCRelease>(key, () =>
      this.discogs.getRelease(id).then((result: any) => DCRelease.parse(result))
    );
  }

  public async getMaster(id: number): Promise<DCMaster> {
    const key = `master_${id}`;
    return this.getCached<DCMaster>(key, () =>
      this.discogs.getMaster(id).then((result: any) => DCMaster.parse(result))
    );
  }

  public async getVersions(id: number): Promise<DCVersions> {
    const key = `versions_${id}`;
    return this.getCached<DCVersions>(key, () =>
      this.discogs
        .getMasterVersions(id)
        .then((result: any) => DCVersions.parse(result))
    );
  }

  // Main initializer
  private init() {
    this.discogs = new Discogs.Client({
      consumerKey: API_CONSUMER_KEY,
      consumerSecret: API_CONSUMER_SECRET,
    }).database();

    const dbPath = path.resolve(__dirname, API_CACHE_FILE);
    this.cache = new Database(dbPath);
    this.initCacheTable();
  }

  // Create a cache table
  private initCacheTable(): void {
    this.cache?.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  // Récupère ou stocke dans le cache
  private async getCached<ResultType>(
    key: string,
    fetcher: () => Promise<ResultType>
  ): Promise<ResultType> {
    if (!this.cache) return this.fetchAndCache<ResultType>(key, fetcher);

    const row = this.cache
      .prepare("SELECT * FROM cache WHERE key = ?")
      .get(key) as CacheEntry;

    return row
      ? (JSON.parse(row.value) as ResultType)
      : this.fetchAndCache(key, fetcher);
  }

  // Fetch the data and add it to the cache
  private async fetchAndCache<ResultType>(
    key: string,
    fetcher: () => Promise<ResultType>
  ): Promise<ResultType> {
    const data = await fetcher();
    await this.delay();

    this.cache
      .prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(data));

    return data;
  }

  private async delay() {
    return new Promise((res) => setTimeout(res, DELAY));
  }
}
