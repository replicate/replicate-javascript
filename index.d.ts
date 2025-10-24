declare module "replicate" {
  type Status = "starting" | "processing" | "succeeded" | "failed" | "canceled" | "aborted";
  type Visibility = "public" | "private";
  type WebhookEventType = "start" | "output" | "logs" | "completed";

  export interface ApiError extends Error {
    request: Request;
    response: Response;
  }

  export interface FileOutput extends ReadableStream {
    blob(): Promise<Blob>;
    url(): URL;
    toString(): string;
  }

  export interface Account {
    type: "user" | "organization";
    username: string;
    name: string;
    github_url?: string;
    avatar_url?: string;
  }

  export interface Collection {
    name: string;
    slug: string;
    description: string;
    full_description: string | null;
    models?: Model[];
  }

  export interface Deployment {
    owner: string;
    name: string;
    current_release: {
      number: number;
      model: string;
      version: string;
      created_at: string;
      created_by: Account;
      configuration: {
        hardware: string;
        min_instances: number;
        max_instances: number;
      };
    };
  }

  export interface FileObject {
    id: string;
    content_type: string;
    size: number;
    checksums: {
      sha256: string;
    };
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at: string | null;
    urls: {
      get: string;
    };
  }

  export interface Hardware {
    sku: string;
    name: string;
  }

  export interface Model {
    url: string;
    owner: string;
    name: string;
    description?: string;
    visibility: "public" | "private";
    is_official: boolean;
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
    cog_version: string | null;
    openapi_schema: object | null;
  }

  export interface Prediction {
    id: string;
    status: Status;
    model: string;
    version: string | "hidden";
    input: object;
    output?: any; // TODO: this should be `unknown`
    source: "api" | "web";
    error?: unknown;
    logs?: string;
    data_removed: boolean;
    deadline?: string;
    deployment?: string;
    metrics?: {
      predict_time?: number;
      total_time?: number;
    };
    webhook?: string;
    webhook_events_filter?: WebhookEventType[];
    created_at: string;
    started_at?: string;
    completed_at?: string;
    urls: {
      get: string;
      cancel: string;
      stream?: string;
      web?: string;
    };
  }

  export interface Training {
    id: string;
    status: Status;
    model: string;
    version: string;
    input: object;
    output?: {
      version?: string;
      weights?: string;
    };
    source: "api" | "web";
    error?: unknown;
    logs?: string;
    metrics?: {
      predict_time?: number;
      total_time?: number;
    };
    webhook?: string;
    webhook_events_filter?: WebhookEventType[];
    created_at: string;
    started_at?: string;
    completed_at?: string;
    urls: {
      get: string;
      cancel: string;
      web?: string;
    };
  }

  export type FileEncodingStrategy = "default" | "upload" | "data-uri";

  export interface Page<T> {
    previous?: string;
    next?: string;
    results: T[];
  }

  export interface ServerSentEvent {
    event: string;
    data: string;
    id?: string;
    retry?: number;
  }

  export interface WebhookSecret {
    key: string;
  }

  export default class Replicate {
    constructor(options?: {
      auth?: string;
      userAgent?: string;
      baseUrl?: string;
      fetch?: (
        input: Request | string,
        init?: RequestInit
      ) => Promise<Response>;
      fileEncodingStrategy?: FileEncodingStrategy;
      useFileOutput?: boolean;
    });

    auth: string;
    userAgent?: string;
    baseUrl?: string;
    fetch: (input: Request | string, init?: RequestInit) => Promise<Response>;
    fileEncodingStrategy: FileEncodingStrategy;

    run(
      identifier: `${string}/${string}` | `${string}/${string}:${string}`,
      options: {
        input: object;
        wait?:
          | { mode: "block"; interval?: number; timeout?: number }
          | { mode: "poll"; interval?: number };
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
        signal?: AbortSignal;
      },
      progress?: (prediction: Prediction) => void
    ): Promise<object>;

    stream(
      identifier: `${string}/${string}` | `${string}/${string}:${string}`,
      options: {
        input: object;
        webhook?: string;
        webhook_events_filter?: WebhookEventType[];
        signal?: AbortSignal;
      }
    ): AsyncGenerator<ServerSentEvent>;

    request(
      route: string | URL,
      options: {
        method?: string;
        headers?: object | Headers;
        params?: object;
        data?: object;
        signal?: AbortSignal;
      }
    ): Promise<Response>;

    paginate<T>(
      endpoint: () => Promise<Page<T>>,
      options?: { signal?: AbortSignal }
    ): AsyncGenerator<T[]>;

    wait(
      prediction: Prediction,
      options?: {
        interval?: number;
      },
      stop?: (prediction: Prediction) => Promise<boolean>
    ): Promise<Prediction>;

    accounts: {
      current(options?: { signal?: AbortSignal }): Promise<Account>;
    };

    collections: {
      list(options?: { signal?: AbortSignal }): Promise<Page<Collection>>;
      get(
        collection_slug: string,
        options?: { signal?: AbortSignal }
      ): Promise<Collection>;
    };

    deployments: {
      predictions: {
        create(
          deployment_owner: string,
          deployment_name: string,
          options: {
            input: object;
            /** @deprecated */
            stream?: boolean;
            webhook?: string;
            webhook_events_filter?: WebhookEventType[];
            wait?: number | boolean;
            signal?: AbortSignal;
          }
        ): Promise<Prediction>;
      };
      get(
        deployment_owner: string,
        deployment_name: string,
        options?: { signal?: AbortSignal }
      ): Promise<Deployment>;
      create(
        deployment_config: {
          name: string;
          model: string;
          version: string;
          hardware: string;
          min_instances: number;
          max_instances: number;
        },
        options?: { signal?: AbortSignal }
      ): Promise<Deployment>;
      update(
        deployment_owner: string,
        deployment_name: string,
        deployment_config: {
          version?: string;
          hardware?: string;
          min_instances?: number;
          max_instances?: number;
        } & (
          | { version: string }
          | { hardware: string }
          | { min_instances: number }
          | { max_instances: number }
        ),
        options?: { signal?: AbortSignal }
      ): Promise<Deployment>;
      delete(
        deployment_owner: string,
        deployment_name: string,
        options?: { signal?: AbortSignal }
      ): Promise<boolean>;
      list(options?: { signal?: AbortSignal }): Promise<Page<Deployment>>;
    };

    files: {
      create(
        file: Blob | Buffer,
        metadata?: Record<string, unknown>,
        options?: { signal?: AbortSignal }
      ): Promise<FileObject>;
      list(options?: { signal?: AbortSignal }): Promise<Page<FileObject>>;
      get(
        file_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<FileObject>;
      delete(
        file_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<boolean>;
    };

    hardware: {
      list(options?: { signal?: AbortSignal }): Promise<Hardware[]>;
    };

    models: {
      get(
        model_owner: string,
        model_name: string,
        options?: { signal?: AbortSignal }
      ): Promise<Model>;
      list(options?: { signal?: AbortSignal }): Promise<Page<Model>>;
      create(
        model_owner: string,
        model_name: string,
        options: {
          visibility: Visibility;
          hardware: string;
          description?: string;
          github_url?: string;
          paper_url?: string;
          license_url?: string;
          cover_image_url?: string;
          signal?: AbortSignal;
        }
      ): Promise<Model>;
      versions: {
        list(
          model_owner: string,
          model_name: string,
          options?: { signal?: AbortSignal }
        ): Promise<Page<ModelVersion>>;
        get(
          model_owner: string,
          model_name: string,
          version_id: string,
          options?: { signal?: AbortSignal }
        ): Promise<ModelVersion>;
      };
      search(
        query: string,
        options?: { signal?: AbortSignal }
      ): Promise<Page<Model>>;
    };

    predictions: {
      create(
        options: {
          model?: string;
          version?: string;
          input: object;
          /** @deprecated */
          stream?: boolean;
          webhook?: string;
          webhook_events_filter?: WebhookEventType[];
          wait?: boolean | number;
          signal?: AbortSignal;
        } & ({ version: string } | { model: string })
      ): Promise<Prediction>;
      get(
        prediction_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<Prediction>;
      cancel(
        prediction_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<Prediction>;
      list(options?: { signal?: AbortSignal }): Promise<Page<Prediction>>;
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
          signal?: AbortSignal;
        }
      ): Promise<Training>;
      get(
        training_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<Training>;
      cancel(
        training_id: string,
        options?: { signal?: AbortSignal }
      ): Promise<Training>;
      list(options?: { signal?: AbortSignal }): Promise<Page<Training>>;
    };

    webhooks: {
      default: {
        secret: {
          get(options?: { signal?: AbortSignal }): Promise<WebhookSecret>;
        };
      };
    };
  }

  export function validateWebhook(
    request: Request,
    secret: string,
    crypto?: Crypto
  ): Promise<boolean>;

  export function validateWebhook(
    requestData: {
      id: string;
      timestamp: string;
      signature: string;
      body: string;
      secret: string;
    },
    crypto?: Crypto
  ): Promise<boolean>;

  export function parseProgressFromLogs(logs: Prediction | string): {
    percentage: number;
    current: number;
    total: number;
  } | null;
}
