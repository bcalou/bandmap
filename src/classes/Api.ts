import {
  DCArtist,
  DCArtistReleases,
  DCMaster,
  DCRelease,
  DCVersions,
} from "../types";

// @ts-ignore
import * as Discogs from "disconnect";

export const DELAY = 1000;
export const PER_PAGE = 100;

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

  public async getArtist(id: number): Promise<DCArtist> {
    await this.delay();
    return this.database
      .getArtist(id)
      .then((result: any) => DCArtist.parse(result));
  }

  public async getArtistReleases(
    id: number,
    page = 1
  ): Promise<DCArtistReleases> {
    await this.delay();
    return this.database
      .getArtistReleases(id, { page: page, per_page: PER_PAGE })
      .then((result: any) => DCArtistReleases.parse(result));
  }

  public async getRelease(id: number): Promise<DCRelease> {
    await this.delay();
    return this.database
      .getRelease(id)
      .then((result: any) => DCRelease.parse(result));
  }

  public async getMaster(id: number): Promise<DCMaster> {
    await this.delay();
    return this.database
      .getMaster(id)
      .then((result: any) => DCMaster.parse(result));
  }

  public async getVersions(id: number): Promise<DCVersions> {
    await this.delay();
    return this.database
      .getMasterVersions(id)
      .then((result: any) => DCVersions.parse(result));
  }

  private async delay() {
    return new Promise((res) => setTimeout(res, DELAY));
  }
}
