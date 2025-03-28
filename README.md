# Replicate Node.js client

A Node.js client for [Replicate](https://replicate.com).
It lets you run models from your Node.js code,
and everything else you can do with
[Replicate's HTTP API](https://replicate.com/docs/reference/http).

> [!IMPORTANT]
> This library can't interact with Replicate's API directly from a browser.
> For more information about how to build a web application
> check out our ["Build a website with Next.js"](https://replicate.com/docs/get-started/nextjs) guide.

## Supported platforms

- [Node.js](https://nodejs.org) >= 18
- [Bun](https://bun.sh) >= 1.0
- [Deno](https://deno.com) >= 1.28

You can also use this client library on most serverless platforms, including
[Cloudflare Workers](https://developers.cloudflare.com/workers/),
[Vercel functions](https://vercel.com/docs/functions), and
[AWS Lambda](https://aws.amazon.com/lambda/).

## Installation

Install it from npm:

```bash
npm install replicate
```

## Usage

Import or require the package:

```js
// CommonJS (default or using .cjs extension)
const Replicate = require("replicate");

// ESM (where `"module": true` in package.json or using .mjs extension)
import Replicate from "replicate";
```

Instantiate the client:

```js
const replicate = new Replicate({
  // get your token from https://replicate.com/account/api-tokens
  auth: "my api token", // defaults to process.env.REPLICATE_API_TOKEN
});
```

Run a model and await the result:

```js
const model = "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478";
const input = {
  prompt: "a 19th century portrait of a raccoon gentleman wearing a suit",
};
const [output] = await replicate.run(model, { input });
// FileOutput('https://replicate.delivery/pbxt/GtQb3Sgve42ZZyVnt8xjquFk9EX5LP0fF68NTIWlgBMUpguQA/out-0.png')

console.log(output.url()); // 'https://replicate.delivery/pbxt/GtQb3Sgve42ZZyVnt8xjquFk9EX5LP0fF68NTIWlgBMUpguQA/out-0.png'
console.log(output.blob()); // Blob
```

> [!NOTE]
> A model that outputs file data returns a `FileOutput` object by default. This is an implementation
> of `ReadableStream` that returns the file contents. It has a `.blob()` method for accessing a
> `Blob` representation and a `.url()` method that will return the underlying data-source.
>
> We recommend accessing file data directly either as readable stream or via `.blob()` as the
> `.url()` property may not always return a HTTP URL in future.

You can also run a model in the background:

```js
let prediction = await replicate.predictions.create({
  version: "27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
  input: {
    prompt: "painting of a cat by andy warhol",
  },
});
```

Then fetch the prediction result later:

```js
prediction = await replicate.predictions.get(prediction.id);
```

Or wait for the prediction to finish:

```js
prediction = await replicate.wait(prediction);
console.log(prediction.output);
// ['https://replicate.delivery/pbxt/RoaxeXqhL0xaYyLm6w3bpGwF5RaNBjADukfFnMbhOyeoWBdhA/out-0.png']
```

To run a model that takes a file input you can pass either
a URL to a publicly accessible file on the Internet
or a handle to a file on your local device.

```js
const fs = require("node:fs/promises");

// Or when using ESM.
// import fs from "node:fs/promises";

const model = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";
const input = {
  image: await fs.readFile("path/to/image.png"),
};
const [output] = await replicate.run(model, { input });
// FileOutput('https://replicate.delivery/mgxm/e7b0e122-9daa-410e-8cde-006c7308ff4d/output.png')
```

> [!NOTE]
> File handle inputs are automatically uploaded to Replicate.
> See [`replicate.files.create`](#replicatefilescreate) for more information.
> The maximum size for uploaded files is 100MiB.
> To run a model with a larger file as an input,
> upload the file to your own storage provider
> and pass a publicly accessible URL.

## TypeScript usage

This library exports TypeScript definitions. You can import them like this:

```ts
import Replicate, { type Prediction } from 'replicate';
```

Here's an example that uses the `Prediction` type with a custom `onProgress` callback:

```ts
import Replicate, { type Prediction } from 'replicate';

const replicate = new Replicate();
const model = "black-forest-labs/flux-schnell";
const prompt = "a 19th century portrait of a raccoon gentleman wearing a suit";
function onProgress(prediction: Prediction) {
  console.log({ prediction });
}

const output = await replicate.run(model, { input: { prompt } }, onProgress)
console.log({ output })
```

See the full list of exported types in [index.d.ts](./index.d.ts).

### Webhooks

Webhooks provide real-time updates about your prediction. Specify an endpoint when you create a prediction, and Replicate will send HTTP POST requests to that URL when the prediction is created, updated, and finished.

It is possible to provide a URL to the predictions.create() function that will be requested by Replicate when the prediction status changes. This is an alternative to polling.

To receive webhooks you’ll need a web server. The following example uses Hono, a web standards based server, but this pattern applies to most frameworks.

<details>
  <summary>See example</summary>

```js
import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();
app.get('/webhooks/replicate', async (c) => {
  // Get the prediction from the request.
  const prediction = await c.req.json();
  console.log(prediction);
  //=> {"id": "xyz", "status": "successful", ... }

  // Acknowledge the webhook.
  c.status(200);
  c.json({ok: true});
}));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
  //=> Listening on http://localhost:3000
});
```

</details>

Create the prediction passing in the webhook URL to `webhook` and specify which events you want to receive in `webhook_events_filter` out of "start", "output", ”logs” and "completed":

```js
const Replicate = require("replicate");
const replicate = new Replicate();

const input = {
    image: "https://replicate.delivery/pbxt/KWDkejqLfER3jrroDTUsSvBWFaHtapPxfg4xxZIqYmfh3zXm/Screenshot%202024-02-28%20at%2022.14.00.png",
    denoising_strength: 0.5,
    instant_id_strength: 0.8
};

const callbackURL = `https://my.app/webhooks/replicate`;
await replicate.predictions.create({
  version: "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca",
  input: input,
  webhook: callbackURL,
  webhook_events_filter: ["completed"],
});

// The server will now handle the event and log:
// => {"id": "xyz", "status": "successful", ... }
```

## Verifying webhooks

To prevent unauthorized requests, Replicate signs every webhook and its metadata with a unique key for each user or organization. You can use this signature to verify the webhook indeed comes from Replicate before you process it.

This client includes a `validateWebhook` convenience function that you can use to validate webhooks.

To validate webhooks:

1. Check out the [webhooks guide](https://replicate.com/docs/webhooks) to get started.
1. [Retrieve your webhook signing secret](https://replicate.com/docs/webhooks#retrieving-the-webhook-signing-key) and store it in your enviroment.
1. Update your webhook handler to call `validateWebhook(request, secret)`, where `request` is an instance of a [web-standard `Request` object](https://developer.mozilla.org/en-US/docs/Web/API/object), and `secret` is the signing secret for your environment.

Here's an example of how to validate webhooks using Next.js:

```js
import { NextResponse } from 'next/server';
import { validateWebhook } from 'replicate';

export async function POST(request) {
  const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;

  if (!secret) {
    console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET")
    const body = await request.json();
    console.log(body);
    return NextResponse.json({ detail: "Webhook received (but not validated)" }, { status: 200 });
  }

  const webhookIsValid = await validateWebhook(request.clone(), secret);

  if (!webhookIsValid) {
    return NextResponse.json({ detail: "Webhook is invalid" }, { status: 401 });
  }

  // process validated webhook here...
  console.log("Webhook is valid!");
  const body = await request.json();
  console.log(body);

  return NextResponse.json({ detail: "Webhook is valid" }, { status: 200 });
}
```

If your environment doesn't support `Request` objects, you can pass the required information to `validateWebhook` directly:

```js
const requestData = {
  id: "123",            // the `Webhook-Id` header
  timestamp: "0123456", // the `Webhook-Timestamp` header
  signature: "xyz",     // the `Webhook-Signature` header
  body: "{...}",        // the request body as a string, ArrayBuffer or ReadableStream
  secret: "shhh",       // the webhook secret, obtained from the `replicate.webhooks.defaul.secret` endpoint
};
const webhookIsValid = await validateWebhook(requestData);
```

> [!NOTE]
> The `validateWebhook` function uses the global `crypto` API available in most JavaScript runtimes. Node <= 18 does not provide this global so in this case you need to either call node with the `--no-experimental-global-webcrypto` or provide the `webcrypto` module manually.
> ```js
> const crypto = require("node:crypto").webcrypto;
> const webhookIsValid = await valdiateWebhook(requestData, crypto);
> ```

## TypeScript

The `Replicate` constructor and all `replicate.*` methods are fully typed.

Currently in order to support the module format used by `replicate` you'll need to set `esModuleInterop` to `true` in your tsconfig.json.

## API

### Constructor

```js
const replicate = new Replicate(options);
```

| name                           | type     | description                                                                                                                      |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `options.auth`                 | string   | **Required**. API access token                                                                                                   |
| `options.userAgent`            | string   | Identifier of your app. Defaults to `replicate-javascript/${packageJSON.version}`                                                |
| `options.baseUrl`              | string   | Defaults to https://api.replicate.com/v1                                                                                         |
| `options.fetch`                | function | Fetch function to use. Defaults to `globalThis.fetch`                                                                            |
| `options.fileEncodingStrategy` | string   | Determines the file encoding strategy to use. Possible values: `"default"`, `"upload"`, or `"data-uri"`. Defaults to `"default"` |
| `options.useFileOutput`        | boolean  | Determines if the `replicate.run()` method should convert file output into `FileOutput` objects |


The client makes requests to Replicate's API using
[fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
By default, the `globalThis.fetch` function is used,
which is available on [Node.js 18](https://nodejs.org/en/blog/announcements/v18-release-announce#fetch-experimental) and later,
as well as
[Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/fetch/),
[Vercel Functions](https://vercel.com/docs/functions),
and other environments.

On earlier versions of Node.js
and other environments where global fetch isn't available,
you can install a fetch function from an external package like
[cross-fetch](https://www.npmjs.com/package/cross-fetch)
and pass it to the `fetch` option in the constructor.

```js
const Replicate = require("replicate");
const fetch = require("fetch");

// Using ESM:
// import Replicate from "replicate";
// import fetch from "cross-fetch";

const replicate = new Replicate({ fetch });
```

You can also use the `fetch` option to add custom behavior to client requests,
such as injecting headers or adding log statements.

```js
const customFetch = (url, options) => {
  const headers = options && options.headers ? { ...options.headers } : {};
  headers["X-Custom-Header"] = "some value";

  console.log("fetch", { url, ...options, headers });

  return fetch(url, { ...options, headers });
};

const replicate = new Replicate({ fetch: customFetch });
```

### `replicate.run`

Run a model and await the result. Unlike [`replicate.prediction.create`](#replicatepredictionscreate), this method returns only the prediction output rather than the entire prediction object.

```js
const output = await replicate.run(identifier, options, progress);
```

| name                            | type     | description                                                                                                                                                                                                 |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`                    | string   | **Required**. The model version identifier in the format `{owner}/{name}:{version}`, for example `stability-ai/sdxl:8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f`                       |
| `options.input`                 | object   | **Required**. An object with the model inputs.                                                                                                                                                              |
| `options.wait`                  | object   | Options for waiting for the prediction to finish                        | 
| `options.wait.mode`             | `"poll" \| "block"`   | `"block"` holds the request open, `"poll"` makes repeated requests to fetch the prediction. Defaults to `"block"`  |
| `options.wait.interval`         | number   | Polling interval in milliseconds. Defaults to 500 |
| `options.wait.timeout`          | number   | In `"block"` mode determines how long the request will be held open until falling back to polling. Defaults to 60 |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the prediction has new output                                                                                                                                     |
| `options.webhook_events_filter` | string[] | An array of events which should trigger [webhooks](https://replicate.com/docs/webhooks). Allowable values are `start`, `output`, `logs`, and `completed`                                                    |
| `options.signal`                | object   | An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to cancel the prediction                                                                                                     |
| `progress`                      | function | Callback function that receives the prediction object as it's updated. The function is called when the prediction is created, each time it's updated while polling for completion, and when it's completed. |

Throws `Error` if the prediction failed.

Returns `Promise<unknown>` which resolves with the output of running the model.

> [!NOTE]
> Currently the TypeScript return type of `replicate.run()` is `Promise<object>` this is
> misleading as a model can return array types as well as primative types like strings,
> numbers and booleans.

Example:

```js
const model = "stability-ai/sdxl:8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f";
const input = { prompt: "a 19th century portrait of a raccoon gentleman wearing a suit" };
const output = await replicate.run(model, { input });
```

Example that logs progress as the model is running:

```js
const model = "stability-ai/sdxl:8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f";
const input = { prompt: "a 19th century portrait of a raccoon gentleman wearing a suit" };
const onProgress = (prediction) => {
   const last_log_line = prediction.logs.split("\n").pop()
   console.log({id: prediction.id, log: last_log_line})
}
const output = await replicate.run(model, { input }, onProgress)
```

#### Sync vs. Async API (`"poll"` vs. `"block"`)

The `replicate.run()` API takes advantage of the [Replicate sync API](https://replicate.com/docs/topics/predictions/create-a-prediction)
which is optimized for low latency requests to file models like `black-forest-labs/flux-dev` and 
`black-forest-labs/flux-schnell`. When creating a prediction this will hold a connection open to the
server and return a `FileObject` containing the generated file as quickly as possible.

### `replicate.stream`

Run a model and stream its output. Unlike [`replicate.prediction.create`](#replicatepredictionscreate), this method returns only the prediction output rather than the entire prediction object.

```js
for await (const event of replicate.stream(identifier, options)) { /* ... */ }
```

| name                            | type     | description                                                                                                                                              |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`                    | string   | **Required**. The model version identifier in the format `{owner}/{name}` or `{owner}/{name}:{version}`, for example `meta/llama-2-70b-chat`             |
| `options.input`                 | object   | **Required**. An object with the model inputs.                                                                                                           |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the prediction has new output                                                                                  |
| `options.webhook_events_filter` | string[] | An array of events which should trigger [webhooks](https://replicate.com/docs/webhooks). Allowable values are `start`, `output`, `logs`, and `completed` |
| `options.signal`                | object   | An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to cancel the prediction                                                  |

Throws `Error` if the prediction failed.

Returns `AsyncGenerator<ServerSentEvent>` which yields the events of running the model.

Example:

```js
const model = "meta/llama-2-70b-chat";
const options = {
  input: {
    prompt: "Write a poem about machine learning in the style of Mary Oliver.",
  },
  // webhook: "https://smee.io/dMUlmOMkzeyRGjW" // optional
};
const output = [];

for await (const { event, data } of replicate.stream(model, options)) {
  if (event === "output") {
    output.push(data);
  }
}

console.log(output.join("").trim());
```

### Server-sent events

A stream generates server-sent events with the following properties:

| name    | type   | description                                                                  |
| ------- | ------ | ---------------------------------------------------------------------------- |
| `event` | string | The type of event. Possible values are `output`, `logs`, `error`, and `done` |
| `data`  | string | The event data                                                               |
| `id`    | string | The event id                                                                 |
| `retry` | number | The number of milliseconds to wait before reconnecting to the server         |

As the prediction runs, the generator yields `output` and `logs` events. If an error occurs, the generator yields an `error` event with a JSON object containing the error message set to the `data` property. When the prediction is done, the generator yields a `done` event with an empty JSON object set to the `data` property.

Events with the `output` event type have their `toString()` method overridden to return the event data as a string. Other event types return an empty string.

### `replicate.models.get`

Get metadata for a public model or a private model that you own.

```js
const response = await replicate.models.get(model_owner, model_name);
```

| name          | type   | description                                                             |
| ------------- | ------ | ----------------------------------------------------------------------- |
| `model_owner` | string | **Required**. The name of the user or organization that owns the model. |
| `model_name`  | string | **Required**. The name of the model.                                    |

```jsonc
{
  "url": "https://replicate.com/replicate/hello-world",
  "owner": "replicate",
  "name": "hello-world",
  "description": "A tiny model that says hello",
  "visibility": "public",
  "github_url": "https://github.com/replicate/cog-examples",
  "paper_url": null,
  "license_url": null,
  "latest_version": {
    /* ... */
  }
}
```

### `replicate.models.list`

Get a paginated list of all public models.

```js
const response = await replicate.models.list();
```

```jsonc
{
  "next": null,
  "previous": null,
  "results": [
    {
      "url": "https://replicate.com/replicate/hello-world",
      "owner": "replicate",
      "name": "hello-world",
      "description": "A tiny model that says hello",
      "visibility": "public",
      "github_url": "https://github.com/replicate/cog-examples",
      "paper_url": null,
      "license_url": null,
      "run_count": 5681081,
      "cover_image_url": "...",
      "default_example": {
        /* ... */
      },
      "latest_version": {
        /* ... */
      }
    }
  ]
}
```

### `replicate.models.search`

Search for public models on Replicate.

```js
const response = await replicate.models.search(query);
```

| name    | type   | description                            |
| ------- | ------ | -------------------------------------- |
| `query` | string | **Required**. The search query string. |

### `replicate.models.create`

Create a new public or private model.

```js
const response = await replicate.models.create(model_owner, model_name, options);
```

| name                      | type   | description                                                                                                                                                                                                                                               |
| ------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model_owner`             | string | **Required**. The name of the user or organization that will own the model. This must be the same as the user or organization that is making the API request. In other words, the API token used in the request must belong to this user or organization. |
| `model_name`              | string | **Required**. The name of the model. This must be unique among all models owned by the user or organization.                                                                                                                                              |
| `options.visibility`      | string | **Required**. Whether the model should be public or private. A public model can be viewed and run by anyone, whereas a private model can be viewed and run only by the user or organization members that own the model.                                   |
| `options.hardware`        | string | **Required**. The SKU for the hardware used to run the model. Possible values can be found by calling [`replicate.hardware.list()`](#replicatehardwarelist).                                                                                              |
| `options.description`     | string | A description of the model.                                                                                                                                                                                                                               |
| `options.github_url`      | string | A URL for the model's source code on GitHub.                                                                                                                                                                                                              |
| `options.paper_url`       | string | A URL for the model's paper.                                                                                                                                                                                                                              |
| `options.license_url`     | string | A URL for the model's license.                                                                                                                                                                                                                            |
| `options.cover_image_url` | string | A URL for the model's cover image. This should be an image file.                                                                                                                                                                                          |

### `replicate.hardware.list`

List available hardware for running models on Replicate.

```js
const response = await replicate.hardware.list()
```

```jsonc
[
  {"name": "CPU", "sku": "cpu" },
  {"name": "Nvidia T4 GPU", "sku": "gpu-t4" },
  {"name": "Nvidia A40 GPU", "sku": "gpu-a40-small" },
  {"name": "Nvidia A40 (Large) GPU", "sku": "gpu-a40-large" },
]
```

### `replicate.models.versions.list`

Get a list of all published versions of a model, including input and output schemas for each version.

```js
const response = await replicate.models.versions.list(model_owner, model_name);
```

| name          | type   | description                                                             |
| ------------- | ------ | ----------------------------------------------------------------------- |
| `model_owner` | string | **Required**. The name of the user or organization that owns the model. |
| `model_name`  | string | **Required**. The name of the model.                                    |

```jsonc
{
  "previous": null,
  "next": null,
  "results": [
    {
      "id": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
      "created_at": "2022-04-26T19:29:04.418669Z",
      "cog_version": "0.3.0",
      "openapi_schema": {
        /* ... */
      }
    },
    {
      "id": "e2e8c39e0f77177381177ba8c4025421ec2d7e7d3c389a9b3d364f8de560024f",
      "created_at": "2022-03-21T13:01:04.418669Z",
      "cog_version": "0.3.0",
      "openapi_schema": {
        /* ... */
      }
    }
  ]
}
```

### `replicate.models.versions.get`

Get metadata for a specific version of a model.

```js
const response = await replicate.models.versions.get(model_owner, model_name, version_id);
```

| name          | type   | description                                                             |
| ------------- | ------ | ----------------------------------------------------------------------- |
| `model_owner` | string | **Required**. The name of the user or organization that owns the model. |
| `model_name`  | string | **Required**. The name of the model.                                    |
| `version_id`  | string | **Required**. The model version                                         |

```jsonc
{
  "id": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "created_at": "2022-04-26T19:29:04.418669Z",
  "cog_version": "0.3.0",
  "openapi_schema": {
    /* ... */
  }
}
```

### `replicate.collections.get`

Get a list of curated model collections. See [replicate.com/collections](https://replicate.com/collections).

```js
const response = await replicate.collections.get(collection_slug);
```

| name              | type   | description                                                                    |
| ----------------- | ------ | ------------------------------------------------------------------------------ |
| `collection_slug` | string | **Required**. The slug of the collection. See http://replicate.com/collections |

### `replicate.predictions.create`

Run a model with inputs you provide.

```js
const response = await replicate.predictions.create(options);
```

| name                            | type     | description                                                                                                                      |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `options.input`                 | object   | **Required**. An object with the model's inputs                                                                                  |
| `options.model`                 | string   | The name of the model, e.g. `black-forest-labs/flux-schnell`. This is required if you're running an [official model](https://replicate.com/explore#official-models).                                                                                                   |
| `options.version`               | string   | The 64-character [model version id](https://replicate.com/docs/topics/models/versions), e.g. `80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb`. This is required if you're not specifying a `model`.                                                                                                  |
| `options.wait`                  | number   | Wait up to 60s for the prediction to finish before returning. Disabled by default. See [Synchronous predictions](https://replicate.com/docs/topics/predictions/create-a-prediction#sync-mode) for more information.                                                           |
| `options.stream`                | boolean  | Requests a URL for streaming output output                                                                                       |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the prediction has new output                                                          |
| `options.webhook_events_filter` | string[] | You can change which events trigger webhook requests by specifying webhook events (`start` \| `output` \| `logs` \| `completed`) |

```jsonc
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "status": "succeeded",
  "input": {
    "text": "Alice"
  },
  "output": null,
  "error": null,
  "logs": null,
  "metrics": {},
  "created_at": "2022-04-26T22:13:06.224088Z",
  "started_at": null,
  "completed_at": null,
  "urls": {
    "get": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    "cancel": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel",
    "stream": "https://streaming.api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq" // Present only if `options.stream` is `true`
  }
}
```

#### Streaming

Specify the `stream` option when creating a prediction
to request a URL to receive streaming output using
[server-sent events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

If the requested model version supports streaming,
then the returned prediction will have a `stream` entry in its `urls` property
with a URL that you can use to construct an
[`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

```js
if (prediction && prediction.urls && prediction.urls.stream) {
  const source = new EventSource(prediction.urls.stream, { withCredentials: true });

  source.addEventListener("output", (e) => {
    console.log("output", e.data);
  });

  source.addEventListener("error", (e) => {
    console.error("error", JSON.parse(e.data));
  });

  source.addEventListener("done", (e) => {
    source.close();
    console.log("done", JSON.parse(e.data));
  });
}
```

A prediction's event stream consists of the following event types:

| event    | format     | description                                    |
| -------- | ---------- | ---------------------------------------------- |
| `output` | plain text | Emitted when the prediction returns new output |
| `error`  | JSON       | Emitted when the prediction returns an error   |
| `done`   | JSON       | Emitted when the prediction finishes           |

A `done` event is emitted when a prediction finishes successfully,
is cancelled, or produces an error.

### `replicate.predictions.get`

```js
const response = await replicate.predictions.get(prediction_id);
```

| name            | type   | description                     |
| --------------- | ------ | ------------------------------- |
| `prediction_id` | number | **Required**. The prediction id |

```jsonc
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "urls": {
    "get": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    "cancel": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  "status": "starting",
  "input": {
    "text": "Alice"
  },
  "output": null,
  "error": null,
  "logs": null,
  "metrics": {},
  "created_at": "2022-04-26T22:13:06.224088Z",
  "started_at": null,
  "completed_at": null
}
```

### `replicate.predictions.cancel`

Stop a running prediction before it finishes.

```js
const response = await replicate.predictions.cancel(prediction_id);
```

| name            | type   | description                     |
| --------------- | ------ | ------------------------------- |
| `prediction_id` | number | **Required**. The prediction id |

```jsonc
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "urls": {
    "get": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    "cancel": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  "status": "canceled",
  "input": {
    "text": "Alice"
  },
  "output": null,
  "error": null,
  "logs": null,
  "metrics": {},
  "created_at": "2022-04-26T22:13:06.224088Z",
  "started_at": "2022-04-26T22:13:06.224088Z",
  "completed_at": "2022-04-26T22:13:06.224088Z"
}
```

### `replicate.predictions.list`

Get a paginated list of all the predictions you've created.

```js
const response = await replicate.predictions.list();
```

`replicate.predictions.list()` takes no arguments.

```jsonc
{
  "previous": null,
  "next": "https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
  "results": [
    {
      "id": "jpzd7hm5gfcapbfyt4mqytarku",
      "version": "b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05",
      "urls": {
        "get": "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku",
        "cancel": "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku/cancel"
      },
      "source": "web",
      "status": "succeeded",
      "created_at": "2022-04-26T20:00:40.658234Z",
      "started_at": "2022-04-26T20:00:84.583803Z",
      "completed_at": "2022-04-26T20:02:27.648305Z"
    }
    /* ... */
  ]
}
```

### `replicate.trainings.create`

Use the [training API](https://replicate.com/docs/fine-tuning) to fine-tune language models
to make them better at a particular task.
To see what **language models** currently support fine-tuning,
check out Replicate's [collection of trainable language models](https://replicate.com/collections/trainable-language-models).

If you're looking to fine-tune **image models**,
check out Replicate's [guide to fine-tuning image models](https://replicate.com/docs/guides/fine-tune-an-image-model).

```js
const response = await replicate.trainings.create(model_owner, model_name, version_id, options);
```

| name                            | type     | description                                                                                                                      |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `model_owner`                   | string   | **Required**. The name of the user or organization that owns the model.                                                          |
| `model_name`                    | string   | **Required**. The name of the model.                                                                                             |
| `version`                       | string   | **Required**. The model version                                                                                                  |
| `options.destination`           | string   | **Required**. The destination for the trained version in the form `{username}/{model_name}`                                      |
| `options.input`                 | object   | **Required**. An object with the model's inputs                                                                                  |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the training has new output                                                            |
| `options.webhook_events_filter` | string[] | You can change which events trigger webhook requests by specifying webhook events (`start` \| `output` \| `logs` \| `completed`) |

```jsonc
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "version": "3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523",
  "status": "starting",
  "input": {
    "text": "..."
  },
  "output": null,
  "error": null,
  "logs": null,
  "started_at": null,
  "created_at": "2023-03-28T21:47:58.566434Z",
  "completed_at": null
}
```

> **Warning**
> If you try to fine-tune a model that doesn't support training,
> you'll get a `400 Bad Request` response from the server.

### `replicate.trainings.get`

Get metadata and status of a training.

```js
const response = await replicate.trainings.get(training_id);
```

| name          | type   | description                   |
| ------------- | ------ | ----------------------------- |
| `training_id` | number | **Required**. The training id |

```jsonc
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "version": "3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523",
  "status": "succeeded",
  "input": {
    "data": "..."
    "param1": "..."
  },
  "output": {
    "version": "..."
  },
  "error": null,
  "logs": null,
  "webhook_completed": null,
  "started_at": "2023-03-28T21:48:02.402755Z",
  "created_at": "2023-03-28T21:47:58.566434Z",
  "completed_at": "2023-03-28T02:49:48.492023Z"
}
```

### `replicate.trainings.cancel`

Stop a running training job before it finishes.

```js
const response = await replicate.trainings.cancel(training_id);
```

| name          | type   | description                   |
| ------------- | ------ | ----------------------------- |
| `training_id` | number | **Required**. The training id |

```jsonc
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "version": "3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523",
  "status": "canceled",
  "input": {
    "data": "..."
    "param1": "..."
  },
  "output": {
    "version": "..."
  },
  "error": null,
  "logs": null,
  "webhook_completed": null,
  "started_at": "2023-03-28T21:48:02.402755Z",
  "created_at": "2023-03-28T21:47:58.566434Z",
  "completed_at": "2023-03-28T02:49:48.492023Z"
}
```

### `replicate.trainings.list`

Get a paginated list of all the trainings you've run.

```js
const response = await replicate.trainings.list();
```

`replicate.trainings.list()` takes no arguments.

```jsonc
{
  "previous": null,
  "next": "https://api.replicate.com/v1/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
  "results": [
    {
      "id": "jpzd7hm5gfcapbfyt4mqytarku",
      "version": "b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05",
      "urls": {
        "get": "https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku",
        "cancel": "https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku/cancel"
      },
      "source": "web",
      "status": "succeeded",
      "created_at": "2022-04-26T20:00:40.658234Z",
      "started_at": "2022-04-26T20:00:84.583803Z",
      "completed_at": "2022-04-26T20:02:27.648305Z"
    }
    /* ... */
  ]
}
```

### `replicate.deployments.predictions.create`

Run a model using your own custom deployment.

Deployments allow you to run a model with a private, fixed API endpoint. You can configure the version of the model, the hardware it runs on, and how it scales. See the [deployments guide](https://replicate.com/docs/deployments) to learn more and get started.

```js
const response = await replicate.deployments.predictions.create(deployment_owner, deployment_name, options);
```

| name                            | type     | description                                                                                                                      |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `deployment_owner`              | string   | **Required**. The name of the user or organization that owns the deployment                                                      |
| `deployment_name`               | string   | **Required**. The name of the deployment                                                                                         |
| `options.input`                 | object   | **Required**. An object with the model's inputs                                                                                  |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the prediction has new output                                                          |
| `options.webhook_events_filter` | string[] | You can change which events trigger webhook requests by specifying webhook events (`start` \| `output` \| `logs` \| `completed`) |

Use `replicate.wait` to wait for a prediction to finish,
or `replicate.predictions.cancel` to cancel a prediction before it finishes.

### `replicate.deployments.list`

List your deployments.

```js
const response = await replicate.deployments.list();
```

```jsonc
{
  "next": null,
  "previous": null,
  "results": [
    {
      "owner": "acme",
      "name": "my-app-image-generator",
      "current_release": { /* ... */ }
    }
    /* ... */
  ]
}
```

### `replicate.deployments.create`

Create a new deployment.

```js
const response = await replicate.deployments.create(options);
```

| name                    | type   | description                                                                      |
| ----------------------- | ------ | -------------------------------------------------------------------------------- |
| `options.name`          | string | Required. Name of the new deployment                                             |
| `options.model`         | string | Required. Name of the model in the format `{username}/{model_name}`              |
| `options.version`       | string | Required. ID of the model version                                                |
| `options.hardware`      | string | Required. SKU of the hardware to run the deployment on (`cpu`, `gpu-a100`, etc.) |
| `options.min_instances` | number | Minimum number of instances to run. Defaults to 0                                |
| `options.max_instances` | number | Maximum number of instances to scale up to based on traffic. Defaults to 1       |

```jsonc
{
  "owner": "acme",
  "name": "my-app-image-generator",
  "current_release": {
    "number": 1,
    "model": "stability-ai/sdxl",
    "version": "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf",
    "created_at": "2024-03-14T11:43:32.049157Z",
    "created_by": {
       "type": "organization",
       "username": "acme",
       "name": "Acme, Inc.",
       "github_url": "https://github.com/replicate"
    },
    "configuration": {
      "hardware": "gpu-a100",
      "min_instances": 1,
      "max_instances": 0
    }
  }
}
```

### `replicate.deployments.update`

Update an existing deployment.

```js
const response = await replicate.deployments.update(deploymentOwner, deploymentName, options);
```

| name                    | type   | description                                                                      |
| ----------------------- | ------ | -------------------------------------------------------------------------------- |
| `deploymentOwner`       | string | Required. Owner of the deployment                                                |
| `deploymentName`        | string | Required. Name of the deployment to update                                       |
| `options.model`         | string | Name of the model in the format `{username}/{model_name}`                        |
| `options.version`       | string | ID of the model version                                                          |
| `options.hardware`      | string | Required. SKU of the hardware to run the deployment on (`cpu`, `gpu-a100`, etc.) |
| `options.min_instances` | number | Minimum number of instances to run                                               |
| `options.max_instances` | number | Maximum number of instances to scale up to                                       |

```jsonc
{
  "owner": "acme",
  "name": "my-app-image-generator",
  "current_release": {
    "number": 2,
    "model": "stability-ai/sdxl",
    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "created_at": "2024-03-14T11:43:32.049157Z",
    "created_by": {
       "type": "organization",
       "username": "acme",
       "name": "Acme, Inc.",
       "github_url": "https://github.com/replicate"
    },
    "configuration": {
      "hardware": "gpu-a100",
      "min_instances": 1,
      "max_instances": 0
    }
  }
}
```

### `replicate.files.create`

Upload a file to Replicate.

> [!TIP]
> The client library calls this endpoint automatically to upload the contents of
> file handles provided as prediction and training inputs.
> You don't need to call this method directly unless you want more control.
> For example, you might want to reuse a file across multiple predictions
> without re-uploading it each time,
> or you may want to set custom metadata on the file resource.
>
> You can configure how a client handles file handle inputs
> by setting the `fileEncodingStrategy` option in the
> [client constructor](#constructor).

```js
const response = await replicate.files.create(file, metadata);
```

| name       | type                  | description                                                |
| ---------- | --------------------- | ---------------------------------------------------------- |
| `file`     | Blob, File, or Buffer | **Required**. The file to upload.                          |
| `metadata` | object                | Optional. User-provided metadata associated with the file. |

```jsonc
{
    "id": "MTQzODcyMDct0YjZkLWE1ZGYtMmRjZTViNWIwOGEyNjNhNS0",
    "name": "photo.webp",
    "content_type": "image/webp",
    "size": 96936,
    "etag": "f211779ff7502705bbf42e9874a17ab3",
    "checksums": {
        "sha256": "7282eb6991fa4f38d80c312dc207d938c156d714c94681623aedac846488e7d3",
        "md5": "f211779ff7502705bbf42e9874a17ab3"
    },
    "metadata": {
        "customer_reference_id": "123"
    },
    "created_at": "2024-06-28T10:16:04.062Z",
    "expires_at": "2024-06-29T10:16:04.062Z",
    "urls": {
        "get": "https://api.replicate.com/v1/files/MTQzODcyMDct0YjZkLWE1ZGYtMmRjZTViNWIwOGEyNjNhNS0"
    }
}
```

Files uploaded to Replicate using this endpoint expire after 24 hours.

Pass the `urls.get` property of a file resource
to use it as an input when running a model on Replicate.
The value of `urls.get` is opaque,
and shouldn't be inferred from other attributes.

The contents of a file are only made accessible to a model running on Replicate,
and only when passed as a prediction or training input
by the user or organization who created the file.

### `replicate.files.list`

List all files you've uploaded.

```js
const response = await replicate.files.list();
```

### `replicate.files.get`

Get metadata for a specific file.

```js
const response = await replicate.files.get(file_id);
```

| name      | type   | description                       |
| --------- | ------ | --------------------------------- |
| `file_id` | string | **Required**. The ID of the file. |

### `replicate.files.delete`

Delete a file.

Files uploaded using the `replicate.files.create` method expire after 24 hours.
You can use this method to delete them sooner.

```js
const response = await replicate.files.delete(file_id);
```

| name      | type   | description                       |
| --------- | ------ | --------------------------------- |
| `file_id` | string | **Required**. The ID of the file. |

### `replicate.paginate`

Pass another method as an argument to iterate over results
that are spread across multiple pages.

This method is implemented as an
[async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator),
which you can use in a for loop or iterate over manually.

```js
// iterate over paginated results in a for loop
for await (const page of replicate.paginate(replicate.predictions.list)) {
  /* do something with page of results */
}

// iterate over paginated results one at a time
let paginator = replicate.paginate(replicate.predictions.list);
const page1 = await paginator.next();
const page2 = await paginator.next();
// etc.
```

### `replicate.request`

Low-level method used by the Replicate client to interact with API endpoints.

```js
const response = await replicate.request(route, parameters);
```

| name                 | type                | description |
| -------------------- | ------------------- | ----------- |
| `options.route`      | `string`            | Required. REST API endpoint path.
| `options.params`     | `object`            | URL query parameters for the given route. |
| `options.method`     | `string`            | HTTP method for the given route. |
| `options.headers`    | `object`            | Additional HTTP headers for the given route. |
| `options.data`       | `object \| FormData` | Request body. |
| `options.signal`     | `AbortSignal`       | Optional `AbortSignal`. |

The `replicate.request()` method is used by the other methods
to interact with the Replicate API.
You can call this method directly to make other requests to the API.

The method accepts an `AbortSignal` which can be used to cancel the request in flight.

### `FileOutput`

`FileOutput` is a `ReadableStream` instance that represents a model file output. It can be used to stream file data to disk or as a `Response` body to an HTTP request.

```javascript
const [output] = await replicate.run("black-forest-labs/flux-schnell", { 
  input: { prompt: "astronaut riding a rocket like a horse" }
});

// To access the file URL:
console.log(output.url()); //=> "http://example.com"

// To write the file to disk:
fs.writeFile("my-image.png", output);

// To stream the file back to a browser:
return new Response(output);

// To read the file in chunks:
for await (const chunk of output) {
  console.log(chunk); // UInt8Array
}
```

You can opt out of FileOutput by passing `useFileOutput: false` to the `Replicate` constructor:

```javascript
const replicate = new Replicate({ useFileOutput: false });
```

| method               | returns   | description                                                  |
| -------------------- | ------    | ------------------------------------------------------------ |
| `blob()`             | object    | A `Blob` instance containing the binary file                 |
| `url()`              | string    | A `URL` object pointing to the underlying data source. Please note that this may not always be an HTTP URL in future.       |

## Troubleshooting

### Predictions hanging in Next.js

Next.js App Router adds some extensions to `fetch` to make it cache responses. To disable this behavior, set the `cache` option to `"no-store"` on the Replicate client's fetch object:

```js
replicate = new Replicate({/*...*/})
replicate.fetch = (url, options) => {
  return fetch(url, { ...options, cache: "no-store" });
};
```

Alternatively you can use Next.js [`noStore`](https://github.com/replicate/replicate-javascript/issues/136#issuecomment-1847442879) to opt out of caching for your component.
