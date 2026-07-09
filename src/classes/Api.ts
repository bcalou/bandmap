import Database from "better-sqlite3";
import * as Discogs from "disconnect";
import path from "path";
import { ZodObject } from "zod";
import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCVersions,
} from "../types";

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
    return this.getCached<DCArtist>(
      `artist_${id}`,
      () => this.discogs.getArtist(id),
      DCArtist,
    );
  }

  public async getArtistReleases(
    id: number,
    page = 1,
  ): Promise<DCArtistReleases> {
    return this.getCached<DCArtistReleases>(
      `artist_releases_${id}_${page}`,
      () =>
        this.discogs.getArtistReleases(id, {
          sort: "year",
          page,
          per_page: PER_PAGE,
        }),
      DCArtistReleases,
    );
  }

  public async getRelease(id: number): Promise<DCRelease> {
    return this.getCached<DCRelease>(
      `release_${id}`,
      () => this.discogs.getRelease(id),
      DCRelease,
    );
  }

  public async getMaster(id: number): Promise<DCMaster> {
    return this.getCached<DCMaster>(
      `master_${id}`,
      () => this.discogs.getMaster(id),
      DCMaster,
    );
  }

  public async getVersions(id: number, page = 1): Promise<DCVersions> {
    return this.getCached<DCVersions>(
      `versions_${id}_${page}`,
      () =>
        this.discogs.getMasterVersions(id, {
          page,
          per_page: PER_PAGE,
        }),
      DCVersions,
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
    fetcher: () => Promise<any>,
    parser: ZodObject,
  ): Promise<ResultType> {
    const row = this.cache
      .prepare("SELECT * FROM cache WHERE key = ?")
      .get(key) as CacheEntry;

    return row
      ? (JSON.parse(row.value) as ResultType)
      : this.fetchAndCache<ResultType>(key, fetcher, parser);
  }

  // Fetch the data and add it to the cache
  private async fetchAndCache<ResultType>(
    key: string,
    fetcher: () => Promise<any>,
    parser: ZodObject,
  ): Promise<ResultType> {
    const data = await fetcher();
    await this.delay();

    this.cache
      .prepare("INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(data));

    return parser.parse(data) as ResultType;
  }

  private async delay() {
    return new Promise((res) => setTimeout(res, DELAY));
  }
}
