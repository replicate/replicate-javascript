# Replicate Node.js client

A Node.js client for [Replicate](https://replicate.com). It lets you run models from your Node.js code, and everything else you can do with [Replicate's HTTP API](https://replicate.com/docs/reference/http).

> [!IMPORTANT]
> This library can't interact with Replicate's API directly from a browser.
> For more information about how to build a web application
> check out our ["Build a website with Next.js"](https://replicate.com/docs/get-started/nextjs) guide.

## Supported platforms

- [Node.js](https://nodejs.org) >= 18
- [Bun](https://bun.sh) >= 1.0
- [Deno](https://deno.com) >= 1.28

You can also use this client library on most serverless platforms, including [Cloudflare Workers](https://developers.cloudflare.com/workers/), [Vercel functions](https://vercel.com/docs/functions), and [AWS Lambda](https://aws.amazon.com/lambda/).

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
  auth: "my api token",

  // defaults to process.env.REPLICATE_API_TOKEN
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
console.log(output.url());
// 'https://replicate.delivery/pbxt/GtQb3Sgve42ZZyVnt8xjquFk9EX5LP0fF68NTIWlgBMUpguQA/out-0.png'

console.log(output.blob());
// Blob
```

> [!NOTE]
> A model that outputs file data returns a `FileOutput` object by default.

This is an implementation of `ReadableStream` that returns the file contents. It has a `.blob()` method for accessing a `Blob` representation and a `.url()` method that will return the underlying data-source.

We recommend accessing file data directly either as readable stream or via `.blob()` as the `.url()` property may not always return a HTTP URL in future.

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

To run a model that takes a file input you can pass either a URL to a publicly accessible file on the Internet or a handle to a file on your local device.

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

### More examples

#### Tencent Hunyuan Image 3

```js
import { writeFile } from "node:fs/promises";
import Replicate from "replicate";

const replicate = new Replicate();
const input = {
  prompt:
    "An illustration of a pink and brown butterfly on a pink background, with the black text Hunyuan Image 3 on Replicate below.",
};

const output = await replicate.run("tencent/hunyuan-image-3", { input });
await writeFile("hunyuan-image-3.png", output[0]);
```

#### Tencent Hunyuan Video

```js
import { writeFile } from "node:fs/promises";
import Replicate from "replicate";

const replicate = new Replicate();
const input = {
  prompt: "A cat walks on the grass, realistic style.",
  width: 854,
  height: 480,
  video_length: 129,
  infer_steps: 50,
  seed: 42,
};

const output = await replicate.run("tencent/hunyuan-video", { input });
await writeFile("hunyuan-video.mp4", output);
```

#### Tencent Hunyuan3D-2mv

```js
import { readFile, writeFile } from "node:fs/promises";
import Replicate from "replicate";

const replicate = new Replicate();
const input = {
  front_image: await readFile("./front.png"),
  // Optional additional views for better reconstruction:
  // back_image: await readFile("./back.png"),
  // left_image: await readFile("./left.png"),
  // right_image: await readFile("./right.png"),
  file_type: "glb",
  steps: 30,
  guidance_scale: 5,
  target_face_num: 10000,
};

const output = await replicate.run("tencent/hunyuan3d-2mv", { input });
await writeFile("hunyuan3d-2mv.glb", output);
```

## TypeScript usage

This library exports TypeScript definitions.

You can import them like this:

```ts
import Replicate, { type Prediction } from "replicate";
```

Here's an example that uses the `Prediction` type with a custom `onProgress` callback:

```ts
import Replicate, { type Prediction } from "replicate";

const replicate = new Replicate();
const model = "black-forest-labs/flux-schnell";
const prompt = "a 19th century portrait of a raccoon gentleman wearing a suit";

function onProgress(prediction: Prediction) {
  console.log({ prediction });
}

const output = await replicate.run(model, { input: { prompt } }, onProgress);
console.log({ output });
```

See the full list of exported types in [index.d.ts](./index.d.ts).

### Webhooks

Webhooks provide real-time updates about your prediction. Specify an endpoint when you create a prediction, and Replicate will send HTTP POST requests to that URL when the prediction is created, updated, and finished. It is possible to provide a URL to the `predictions.create()` function that will be requested by Replicate when the prediction status changes. This is an alternative to polling. To receive webhooks you’ll need a web server.

The following example uses Hono, a web standards based server, but this pattern applies to most frameworks.

```js
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/webhooks/replicate", async (c) => {
  // Get the prediction from the request.
  const prediction = await c.req.json();
  console.log(prediction);
  //=> {"id": "xyz", "status": "successful", ... }

  // Acknowledge the webhook.
  c.status(200);
  c.json({ ok: true });
});

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
  //=> Listening on http://localhost:3000
});
```

Create the prediction passing in the webhook URL to `webhook` and specify which events you want to receive in `webhook_events_filter` out of `start`, `output`, `logs`, and `completed`:

```js
const Replicate = require("replicate");
const replicate = new Replicate();

const input = {
  image: "https://replicate.delivery/pbxt/KWDkejqLfER3jrroDTUsSvBWFaHtapPxfg4xxZIqYmfh3zXm/Screenshot%202024-02-28%20at%2022.14.00.png",
  denoising_strength: 0.5,
  instant_id_strength: 0.8,
};

const callbackURL = `https://my.app/webhooks/replicate`;

await replicate.predictions.create({
  version: "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca",
  input: input,
  webhook: callbackURL,
  webhook_events_filter: ["completed"],
});
```

## Verifying webhooks

To prevent unauthorized requests, Replicate signs every webhook and its metadata with a unique key for each user or organization. You can use this signature to verify the webhook indeed comes from Replicate before you process it.

This client includes a `validateWebhook` convenience function that you can use to validate webhooks. To validate webhooks:

1. Check out the [webhooks guide](https://replicate.com/docs/webhooks) to get started.
2. [Retrieve your webhook signing secret](https://replicate.com/docs/webhooks#retrieving-the-webhook-signing-key) and store it in your environment.
3. Update your webhook handler to call `validateWebhook(request, secret)`, where `request` is an instance of a [web-standard `Request` object](https://developer.mozilla.org/en-US/docs/Web/API/Request), and `secret` is the signing secret for your environment.

Here's an example of how to validate webhooks using Next.js:

```js
import { NextResponse } from "next/server";
import { validateWebhook } from "replicate";

export async function POST(request) {
  const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;

  if (!secret) {
    console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET");
    const body = await request.json();
    console.log(body);
    return NextResponse.json(
      { detail: "Webhook received (but not validated)" },
      { status: 200 }
    );
  }

  const webhookIsValid = await validateWebhook(request.clone(), secret);
  if (!webhookIsValid) {
    return NextResponse.json({ detail: "Webhook is invalid" }, { status: 401 });
  }

  console.log("Webhook is valid!");
  const body = await request.json();
  console.log(body);
  return NextResponse.json({ detail: "Webhook is valid" }, { status: 200 });
}
```

If your environment doesn't support `Request` objects, you can pass the required information to `validateWebhook` directly:

```js
const requestData = {
  id: "123", // the `Webhook-Id` header
  timestamp: "0123456", // the `Webhook-Timestamp` header
  signature: "xyz", // the `Webhook-Signature` header
  body: "{...}", // the request body as a string, ArrayBuffer or ReadableStream
  secret: "shhh", // the webhook secret, obtained from the `replicate.webhooks.default.secret` endpoint
};

const webhookIsValid = await validateWebhook(requestData);
```

> [!NOTE]
> The `validateWebhook` function uses the global `crypto` API available in most JavaScript runtimes.

Node <= 18 does not provide this global so in this case you need to either call node with the `--no-experimental-global-webcrypto` or provide the `webcrypto` module manually.

```js
const crypto = require("node:crypto").webcrypto;
const webhookIsValid = await validateWebhook(requestData, crypto);
```

## TypeScript

The `Replicate` constructor and all `replicate.*` methods are fully typed.

Currently in order to support the module format used by `replicate` you'll need to set `esModuleInterop` to `true` in your `tsconfig.json`.

## API

### Constructor

```js
const replicate = new Replicate(options);
```

| name | type | description |
| --- | --- | --- |
| `options.auth` | string | **Required**. API access token |
| `options.userAgent` | string | Identifier of your app. Defaults to `replicate-javascript/${packageJSON.version}` |
| `options.baseUrl` | string | Defaults to `https://api.replicate.com/v1` |
| `options.fetch` | function | Fetch function to use. Defaults to `globalThis.fetch` |
| `options.fileEncodingStrategy` | string | Determines the file encoding strategy to use. Possible values: `"default"`, `"upload"`, or `"data-uri"`. Defaults to `"default"` |
| `options.useFileOutput` | boolean | Determines if the `replicate.run()` method should convert file output into `FileOutput` objects |

The client makes requests to Replicate's API using [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch). By default, the `globalThis.fetch` function is used, which is available on [Node.js 18](https://nodejs.org/en/blog/announcements/v18-release-announce#fetch-experimental) and later, as well as [Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/fetch/), [Vercel Functions](https://vercel.com/docs/functions), and other environments.

On earlier versions of Node.js and other environments where global fetch isn't available, you can install a fetch function from an external package like [cross-fetch](https://www.npmjs.com/package/cross-fetch) and pass it to the `fetch` option in the constructor.

```js
const Replicate = require("replicate");
const fetch = require("fetch");

// Using ESM:
// import Replicate from "replicate";
// import fetch from "cross-fetch";

const replicate = new Replicate({ fetch });
```

You can also use the `fetch` option to add custom behavior to client requests, such as injecting headers or adding log statements.

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

Run a model and await the result.

Unlike [`replicate.predictions.create`](#replicatepredictionscreate), this method returns only the prediction output rather than the entire prediction object.

```js
const output = await replicate.run(identifier, options, progress);
```

| name | type | description |
| --- | --- | --- |
| `identifier` | string | **Required**. The model version identifier in the format `{owner}/{name}:{version}`, for example `stability-ai/sdxl:8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f` |
| `options.input` | object | **Required**. An object with the model inputs. |
| `options.wait` | object | Options for waiting for the prediction to finish |
| `options.wait.mode` | `"poll" \| "block"` | `"block"` holds the request open, `"poll"` makes repeated requests to fetch the prediction. Defaults to `"block"` |
| `options.wait.interval` | number | Polling interval in milliseconds. Defaults to 500 |
| `options.wait.timeout` | number | In `"block"` mode determines how long the request will be held open until falling back to polling. Defaults to 60 |
| `options.webhook` | string | An HTTPS URL for receiving a webhook when the prediction has new output |
| `options.webhook_events_filter` | string[] | An array of events which should trigger [webhooks](https://replicate.com/docs/webhooks). Allowable values are `start`, `output`, `logs`, and `completed` |
| `options.signal` | object | An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to cancel the prediction |
| `progress` | function | Callback function that receives the prediction object as it's updated. The function is called when the prediction is created, each time it's updated while polling for completion, and when it's completed. |

Throws `Error` if the prediction failed.

Returns `Promise` which resolves with the output of running the model.

> [!NOTE]
> Currently the TypeScript return type of `replicate.run()` is `Promise<any>`; this is misleading as a model can return array types as well as primitive types like strings, numbers and booleans.

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
  const last_log_line = prediction.logs.split("\n").pop();
  console.log({ id: prediction.id, log: last_log_line });
};

const output = await replicate.run(model, { input }, onProgress);
```

#### Sync vs. Async API (`"poll"` vs. `"block"`)

The `replicate.run()` API takes advantage of the [Replicate sync API](https://replicate.com/docs/topics/predictions/create-a-prediction) which is optimized for low latency requests to file models like `black-forest-labs/flux-dev` and `black-forest-labs/flux-schnell`. When creating a prediction this will hold a connection open to the server and return a `FileObject` containing the generated file as quickly as possible.

### `replicate.stream`

Run a model and stream its output. Unlike [`replicate.prediction.create`](#replicatepredictionscreate), this method returns only the prediction output rather than the entire prediction object.

```js
for await (const event of replicate.stream(identifier, options)) {
  /* ... */
}
```

| name | type | description |
| --- | --- | --- |
| `identifier` | string | **Required**. The model version identifier in the format `{owner}/{name}` or `{owner}/{name}:{version}`, for example `meta/llama-2-70b-chat` |
| `options.input` | object | **Required**. An object with the model inputs. |
| `options.webhook` | string | An HTTPS URL for receiving a webhook when the prediction has new output |
| `options.webhook_events_filter` | string[] | An array of events which should trigger [webhooks](https://replicate.com/docs/webhooks). Allowable values are `start`, `output`, `logs`, and `completed` |
| `options.signal` | object | An [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to cancel the prediction |

Throws `Error` if the prediction failed.

Returns `AsyncGenerator` which yields the events of running the model.

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

| name | type | description |
| --- | --- | --- |
| `event` | string | The type of event. |
| `data` | string | The event data. |
| `id` | string | The event ID. |
| `retry` | number | The reconnection interval in milliseconds. |

Predictions that are streamed receive a `urls.stream` field in the prediction object. This point to an SSE event stream that can be used to consume the model's output.

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

| event | format | description |
| --- | --- | --- |
| `output` | plain text | Emitted when the prediction returns new output |
| `error` | JSON | Emitted when the prediction returns an error |
| `done` | JSON | Emitted when the prediction finishes |

A `done` event is emitted when a prediction finishes successfully, is cancelled, or produces an error.

### `replicate.predictions.get`

```js
const response = await replicate.predictions.get(prediction_id);
```

### `replicate.predictions.cancel`

Stop a running prediction before it finishes.

```js
const response = await replicate.predictions.cancel(prediction_id);
```

### `replicate.predictions.list`

Get a paginated list of all the predictions you've created.

```js
const response = await replicate.predictions.list();
```

`replicate.predictions.list()` takes no arguments.

### `replicate.trainings.create`

Use the [training API](https://replicate.com/docs/fine-tuning) to fine-tune language models to make them better at a particular task. To see what **language models** currently support fine-tuning, check out Replicate's [collection of trainable language models](https://replicate.com/collections/trainable-language-models).

If you're looking to fine-tune **image models**, check out Replicate's [guide to fine-tuning image models](https://replicate.com/docs/guides/fine-tune-an-image-model).

```js
const response = await replicate.trainings.create(model_owner, model_name, version_id, options);
```

### `replicate.trainings.get`

Get metadata and status of a training.

```js
const response = await replicate.trainings.get(training_id);
```

### `replicate.trainings.cancel`

Stop a running training job before it finishes.

```js
const response = await replicate.trainings.cancel(training_id);
```

### `replicate.trainings.list`

Get a paginated list of all the trainings you've run.

```js
const response = await replicate.trainings.list();
```

`replicate.trainings.list()` takes no arguments.

### `replicate.deployments.predictions.create`

Run a model using your own custom deployment. Deployments allow you to run a model with a private, fixed API endpoint. You can configure the version of the model, the hardware it runs on, and how it scales. See the [deployments guide](https://replicate.com/docs/deployments) to learn more and get started.

```js
const response = await replicate.deployments.predictions.create(
  deployment_owner,
  deployment_name,
  options
);
```

### `replicate.deployments.list`

List your deployments.

```js
const response = await replicate.deployments.list();
```

### `replicate.deployments.create`

Create a new deployment.

```js
const response = await replicate.deployments.create(options);
```

### `replicate.deployments.update`

Update an existing deployment.

```js
const response = await replicate.deployments.update(deploymentOwner, deploymentName, options);
```

### `replicate.files.create`

Upload a file to Replicate.

> [!TIP]
> The client library calls this endpoint automatically to upload the contents of file handles provided as prediction and training inputs.
> You don't need to call this method directly unless you want more control.
> For example, you might want to reuse a file across multiple predictions without re-uploading it each time,
> or you may want to set custom metadata on the file resource.
>
> You can configure how a client handles file handle inputs by setting the `fileEncodingStrategy` option in the [client constructor](#constructor).

```js
const response = await replicate.files.create(file, metadata);
```

Files uploaded to Replicate using this endpoint expire after 24 hours.

Pass the `urls.get` property of a file resource to use it as an input when running a model on Replicate. The value of `urls.get` is opaque, and shouldn't be inferred from other attributes. The contents of a file are only made accessible to a model running on Replicate, and only when passed as a prediction or training input by the user or organization who created the file.

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

### `replicate.files.delete`

Delete a file. Files uploaded using the `replicate.files.create` method expire after 24 hours. You can use this method to delete them sooner.

```js
const response = await replicate.files.delete(file_id);
```

### `replicate.paginate`

Pass another method as an argument to iterate over results that are spread across multiple pages.

This method is implemented as an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator), which you can use in a `for await` loop or iterate over manually.

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

### `FileOutput`

`FileOutput` is a `ReadableStream` instance that represents a model file output. It can be used to stream file data to disk or as a `Response` body to an HTTP request.

```javascript
const [output] = await replicate.run("black-forest-labs/flux-schnell", {
  input: { prompt: "astronaut riding a rocket like a horse" },
});

// To access the file URL:
console.log(output.url());
//=> "http://example.com"

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

| method | returns | description |
| --- | --- | --- |
| `blob()` | object | A `Blob` instance containing the binary file |
| `url()` | string | A `URL` object pointing to the underlying data source. Please note that this may not always be an HTTP URL in future. |

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
