type Identifier = `${string}/${string}:${string}`;
type WebhookEventType = 'start' | 'output' | 'logs' | 'completed';

interface Page<T> {
  previous?: string;
  next?: string;
  results: T[];
}

declare module 'replicate' {
  export interface Collection {
    id: string;
    name: string;
    slug: string;
    description: string;
    created: string;
    updated: string;
  }

  export interface Model {
    id: string;
    name: string;
    owner: string;
    created: string;
    updated: string;
  }

  export interface ModelVersion {
    id: string;
    model: string;
    created: string;
    updated: string;
  }

  export interface Prediction {
    id: string;
    version: string;
    input: any;
    output: any;
    webhook?: string;
    webhook_events_filter?: WebhookEventType[];
    created: string;
    updated: string;
  }

  export default class Replicate {
    constructor(options: {
      auth: string;
      userAgent?: string;
      baseUrl?: string;
    });

    auth: string;
    userAgent?: string;
    baseUrl?: string;
    private instance: any;

    run(
      identifier: Identifier,
      options: {
        input: object;
        wait?: boolean | { interval?: number; maxAttempts?: number };
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
      }
    ): Promise<object>;
    request(route: string, parameters: any): Promise<any>;
    paginate<T>(endpoint: () => Promise<Page<T>>): AsyncGenerator<[T]>;
    wait(
      prediction: Prediction,
      options: {
        interval?: number;
        maxAttempts?: number;
      }
    ): Promise<Prediction>;

    collections: {
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
        input: any;
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
      }): Promise<Prediction>;
      get(prediction_id: string): Promise<Prediction>;
      list(): Promise<Page<Prediction>>;
    };
  }
}
