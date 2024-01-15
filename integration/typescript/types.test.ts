import { ApiError, Collection, Hardware, Model, ModelVersion, Page, Prediction, Status, Training, Visibility, WebhookEventType } from "replicate";

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
