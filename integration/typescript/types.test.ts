import { ApiError, Collection, Hardware, Model, ModelVersion, Page, Prediction, Status, Training, Visibility, WebhookEventType } from "replicate";

export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;


type AssertFalse<A extends false> = A

// @ts-expect-error
export type TestAssertion = AssertFalse<Equals<any, any>>

export type TestApiError = AssertFalse<Equals<ApiError, any>>
export type TestCollection = AssertFalse<Equals<Collection, any>>
export type TestHardware = AssertFalse<Equals<Hardware, any>>
export type TestModel = AssertFalse<Equals<Model, any>>
export type TestModelVersion = AssertFalse<Equals<ModelVersion, any>>
export type TestPage = AssertFalse<Equals<Page<unknown>, any>>
export type TestPrediction = AssertFalse<Equals<Prediction, any>>
export type TestStatus = AssertFalse<Equals<Status, any>>
export type TestTraining = AssertFalse<Equals<Training, any>>
export type TestVisibility = AssertFalse<Equals<Visibility, any>>
export type TestWebhookEventType = AssertFalse<Equals<WebhookEventType, any>>


// NOTE: We export the constants to avoid unused varaible issues.

export const collection: Collection = { name: "", slug: "", description: "", models: [] };
export const status: Status = "starting";
export const visibility: Visibility = "public";
export const webhookType: WebhookEventType = "start";
export const err: ApiError = Object.assign(new Error(), {request: new Request("file://"), response: new Response()});
export const hardware: Hardware = { sku: "", name: "" };
export const model: Model = {
    url: "",
    owner: "",
    name: "",
    description: "",
    visibility: "public",
    github_url: "",
    paper_url: "",
    license_url: "",
    run_count: 10,
    cover_image_url: "",
    default_example: undefined,
    latest_version: undefined,
};
export const version: ModelVersion = {
    id: "",
    created_at: "",
    cog_version: "",
    openapi_schema: "",
};
export const prediction: Prediction = {
    id: "",
    status: "starting",
    model: "",
    version: "",
    input: {},
    output: {},
    source: "api",
    error: undefined,
    logs: "",
    metrics: {
        predict_time: 100,
    },
    webhook: "",
    webhook_events_filter: [],
    created_at: "",
    started_at: "",
    completed_at: "",
    urls: {
        get: "",
        cancel: "",
        stream: "",
    },
};
export const training: Training = prediction;

export const page: Page<ModelVersion> = {
    previous: "",
    next: "",
    results: [version],
};
