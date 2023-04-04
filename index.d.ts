type Identifier = `${string}/${string}:${string}`;
type WebhookEventType = "start" | "output" | "logs" | "completed";

declare module "replicate" {
  export interface ReplicateOptions {
    auth: string;
    userAgent?: string;
    baseUrl?: string;
  }

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

  export interface CollectionsGetOptions {
    collection_slug: string;
  }

  export interface ModelsGetOptions {
    model_owner: string;
    model_name: string;
  }

  export interface ModelsVersionsListOptions {
    model_owner: string;
    model_name: string;
  }

  export interface ModelsVersionsGetOptions {
    model_owner: string;
    model_name: string;
    id: string;
  }

  export interface PredictionsCreateOptions {
    version: string;
    input: any;
    webhook?: string;
    webhook_events_filter?: WebhookEventType[];
  }

  export interface PredictionsGetOptions {
    predictionId: string;
  }

  export class Replicate {
    constructor(options: ReplicateOptions);

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
    paginate<T>(endpoint: () => Promise<T>): AsyncGenerator<T[]>;
    wait(
      prediction: Prediction,
      options: {
        interval?: number;
        maxAttempts?: number;
      }
    ): Promise<Prediction>;

    collections: {
      get(options: CollectionsGetOptions): Promise<Collection>;
    };

    models: {
      get(options: ModelsGetOptions): Promise<Model>;
      versions: {
        list(options: ModelsVersionsListOptions): Promise<ModelVersion[]>;
        get(options: ModelsVersionsGetOptions): Promise<ModelVersion>;
      };
    };

    predictions: {
      create(options: PredictionsCreateOptions): Promise<Prediction>;
      get(options: PredictionsGetOptions): Promise<Prediction>;
      list(): Promise<Prediction[]>;
    };
  }

  export default Replicate;
}
