export type WebhookEventType = 'start' | 'output' | 'logs' | 'completed';
export type Status =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export { Request, Response, Headers } from 'cross-fetch'; //Note: not used in build.

type RequestInfo = Request | string;
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;
