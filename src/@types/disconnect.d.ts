// Type declarations for the 'disconnect' Discogs API client
// Project: https://github.com/discogs/disconnect
// Definitions by: [Your Name]

declare module "disconnect" {
  import { EventEmitter } from "events";

  // --- Core Types ---
  export interface DiscogsClientOptions {
    consumerKey: string;
    consumerSecret: string;
    userToken?: string;
    userSecret?: string;
    oauth?: {
      consumerKey: string;
      consumerSecret: string;
      token?: string;
      tokenSecret?: string;
    };
  }

  export interface PaginationOptions {
    page?: number;
    per_page?: number;
  }

  export interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, any>;
  }

  // --- Database API ---
  export interface DatabaseAPI {
    getArtist(id: number): Promise<any>;
    getArtistReleases(id: number, options?: PaginationOptions): Promise<any>;
    getRelease(id: number): Promise<any>;
    getMaster(id: number): Promise<any>;
    getMasterVersions(id: number, options?: PaginationOptions): Promise<any>;
    search(
      query: string,
      options?: { type?: string; page?: number; per_page?: number }
    ): Promise<any>;
    // Add other database methods as needed
  }

  // --- User API ---
  export interface UserAPI {
    getIdentity(): Promise<any>;
    getCollectionFolders(user: string): Promise<any>;
    getCollectionReleases(
      user: string,
      folderId?: number,
      options?: PaginationOptions
    ): Promise<any>;
    // Add other user methods as needed
  }

  // --- Marketplace API ---
  export interface MarketplaceAPI {
    getListing(id: number): Promise<any>;
    getInventory(user: string, options?: PaginationOptions): Promise<any>;
    // Add other marketplace methods as needed
  }

  // --- Main Client ---
  export interface DiscogsClient {
    database(): DatabaseAPI;
    user(): UserAPI;
    marketplace(): MarketplaceAPI;
    setToken(token: string, secret: string): void;
    oauth(): {
      getRequestToken: (
        callbackUrl: string,
        permissions: string[],
        callback: (err: Error | null, data: any) => void
      ) => void;
      getAccessToken: (
        verifier: string,
        requestToken: string,
        requestTokenSecret: string,
        callback: (err: Error | null, data: any) => void
      ) => void;
    };
    request(path: string, options?: RequestOptions): Promise<any>;
  }

  // --- Constructor ---
  export class Client extends EventEmitter {
    constructor(options: DiscogsClientOptions);
    database(): DatabaseAPI;
    user(): UserAPI;
    marketplace(): MarketplaceAPI;
    setToken(token: string, secret: string): void;
    oauth: () => {
      getRequestToken: (
        callbackUrl: string,
        permissions: string[],
        callback: (err: Error | null, data: any) => void
      ) => void;
      getAccessToken: (
        verifier: string,
        requestToken: string,
        requestTokenSecret: string,
        callback: (err: Error | null, data: any) => void
      ) => void;
    };
    request(path: string, options?: RequestOptions): Promise<any>;
  }

  // --- Exports ---
  // export = Client;
}
