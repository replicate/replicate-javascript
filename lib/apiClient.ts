import { FetchLike } from './types';
import packageJSON from '../package.json';

export interface RequestOptions {
  method?: string;
  params?: object;
  data?: object;
}

export interface Page<T> {
  previous?: string;
  next?: string;
  results: T[];
}

const BASE_URL = 'https://api.replicate.com/v1';

export default class APIClient {
  constructor(
    readonly auth: string,
    readonly userAgent: string = `replicate-javascript/${packageJSON.version}`,
    readonly baseUrl: string = BASE_URL,
    readonly customFetch?: FetchLike
  ) {}

  async request<T>(route: string, parameters: RequestOptions): Promise<T> {
    const url = new URL(
      route.startsWith('/') ? route.slice(1) : route,
      this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
    );

    const { method = 'GET', params = {}, data } = parameters;

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const headers = {
      Authorization: `Token ${this.auth}`,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };

    let localFetch = this.customFetch;
    if (!localFetch) {
      localFetch = fetch;
    }

    const response = await localFetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Paginate through a list of results.
   *
   * @generator
   * @example
   * for await (const page of replicate.paginate(replicate.predictions.list) {
   *    console.log(page);
   * }
   * @param {Function} endpoint - Function that returns a promise for the next page of results
   * @yields {object[]} Each page of results
   */
  async *paginate<T>(endpoint: () => Promise<Page<T>>): AsyncGenerator<T[]> {
    const response = await endpoint();

    let next = response.next;

    yield response.results;

    if (response.next) {
      console.log(response.next);

      const nextPage = (): Promise<Page<T>> => {
        return this.request(response.next as string, { method: 'GET' });
      };

      yield* this.paginate(nextPage);
    }
  }
}
