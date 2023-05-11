declare module 'replicate' {
  type Status = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  type WebhookEventType = 'start' | 'output' | 'logs' | 'completed';

  interface Page<T> {
    previous?: string;
    next?: string;
    results: T[];
  }

  export interface Collection {
    name: string;
    slug: string;
    description: string;
    models?: Model[];
  }

  export interface Model {
    url: string;
    owner: string;
    name: string;
    description?: string;
    visibility: 'public' | 'private';
    github_url?: string;
    paper_url?: string;
    license_url?: string;
    run_count: number;
    cover_image_url?: string;
    default_example?: Prediction;
    latest_version?: ModelVersion;
  }

  export interface ModelVersion {
    id: string;
    created_at: string;
    cog_version: string;
    openapi_schema: object;
  }

  export interface Prediction {
    id: string;
    status: Status;
    version: string;
    input: object;
    output?: any;
    source: 'api' | 'web';
    error?: any;
    logs?: string;
    metrics?: {
      predict_time?: number;
    }
    webhook?: string;
    webhook_events_filter?: WebhookEventType[];
    created_at: string;
    updated_at: string;
    completed_at?: string;
  }

  export type Training = Prediction;

  export default class Replicate {
    constructor(options: {
      auth: string;
      userAgent?: string;
      baseUrl?: string;
      fetch?: Function;
    });

    auth: string;
    userAgent?: string;
    baseUrl?: string;
    fetch: Function;

    run(
      identifier: `${string}/${string}:${string}`,
      options: {
        input: object;
        wait?: boolean | { interval?: number; maxAttempts?: number };
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
      }
    ): Promise<object>;
    request(route: string, parameters: any): Promise<any>;
    paginate<T>(endpoint: () => Promise<Page<T>>): AsyncGenerator<[ T ]>;
    wait(
      prediction: Prediction,
      options: {
        interval?: number;
        maxAttempts?: number;
      }
    ): Promise<Prediction>;

    collections: {
      list(): Promise<Page<Collection>>;
      get(collection_slug: string): Promise<Collection>;
    };

    models: {
      get(model_owner: string, model_name: string): Promise<Model>;
      versions: {
        list(model_owner: string, model_name: string): Promise<ModelVersion[]>;
        get(
          model_owner: string,
          model_name: string,
          version_id: string
        ): Promise<ModelVersion>;
      };
    };

    predictions: {
      create(options: {
        version: string;
        input: object;
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
      }): Promise<Prediction>;
      get(prediction_id: string): Promise<Prediction>;
      cancel(prediction_id: string): Promise<Prediction>;
      list(): Promise<Page<Prediction>>;
    };

    trainings: {
      create(
        model_owner: string,
        model_name: string,
        version_id: string,
        options: {
          destination: `${string}/${string}`;
          input: object;
          webhook?: string;
          webhook_events_filter?: WebhookEventType[];
        }
      ): Promise<Training>;
      get(training_id: string): Promise<Training>;
      cancel(training_id: string): Promise<Training>;
      list(): Promise<Page<Training>>;
    };
  }
}
