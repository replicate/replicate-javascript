# Replicate Node.js client

A Node.js client for [Replicate](https://replicate.com).
It lets you run models from your Node.js code,
and everything else you can do with
[Replicate's HTTP API](https://replicate.com/docs/reference/http).

> **Warning**
> This library can't interact with Replicate's API directly from a browser.
> For more information about how to build a web application
> check out our ["Build a website with Next.js"](https://replicate.com/docs/get-started/nextjs) guide.

## Installation

Install it from npm:

```bash
npm install replicate
```

## Usage

Create the client:

```js
import Replicate from "replicate";

const replicate = new Replicate({
  // get your token from https://replicate.com/account
  auth: process.env.REPLICATE_API_TOKEN,
});
```

Run a model and await the result:

```js
const model = "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478";
const input = {
  prompt: "a 19th century portrait of a raccoon gentleman wearing a suit",
};
const output = await replicate.run(model, { input });
// ['https://replicate.delivery/pbxt/GtQb3Sgve42ZZyVnt8xjquFk9EX5LP0fF68NTIWlgBMUpguQA/out-0.png']
```

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

To run a model that takes a file input,
convert its data into a base64-encoded data URI:

```js
import { promises as fs } from "fs";

// Read the file into a buffer
const data = await fs.readFile("path/to/image.png", "utf-8");
// Convert the buffer into a base64-encoded string
const base64 = data.toString("base64");
// Set MIME type for PNG image
const mimeType = "image/png";
// Create the data URI
const dataURI = `data:${mimeType};base64,${base64}`;

const model = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";
const input = {
  image: dataURI,
};
const output = await replicate.run(model, { input });
// ['https://replicate.delivery/mgxm/e7b0e122-9daa-410e-8cde-006c7308ff4d/output.png']
```

## API

### Constructor

```js
const replicate = new Replicate(options);
```

| name                | type     | description                                                                       |
| ------------------- | -------- | --------------------------------------------------------------------------------- |
| `options.auth`      | string   | **Required**. API access token                                                    |
| `options.userAgent` | string   | Identifier of your app. Defaults to `replicate-javascript/${packageJSON.version}` |
| `options.baseUrl`   | string   | Defaults to https://api.replicate.com/v1                                          |
| `options.fetch`     | function | Fetch function to use. Defaults to `globalThis.fetch`                             |

The client makes requests to Replicate's API using
[fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
By default, the `globalThis.fetch` function is used,
which is available on [Node.js 18](https://nodejs.org/en/blog/announcements/v18-release-announce#fetch-experimental) and later,
as well as
[Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/fetch/),
[Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions),
and other environments.

On earlier versions of Node.js
and other environments where global fetch isn't available,
you can install a fetch function from an external package like
[cross-fetch](https://www.npmjs.com/package/cross-fetch)
and pass it to the `fetch` option in the constructor.

```js
import Replicate from "replicate";
import fetch from "cross-fetch";

const replicate = new Replicate({
  // get your token from https://replicate.com/account
  auth: process.env.REPLICATE_API_TOKEN,
  fetch: fetch,
});
```

### `replicate.models.get`

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

### `replicate.models.versions.list`

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

```js
const response = await replicate.collections.get(collection_slug);
```

| name              | type   | description                                                                    |
| ----------------- | ------ | ------------------------------------------------------------------------------ |
| `collection_slug` | string | **Required**. The slug of the collection. See http://replicate.com/collections |

### `replicate.predictions.create`

```js
const response = await replicate.predictions.create(options);
```

| name                            | type     | description                                                                                                                      |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `options.version`               | string   | **Required**. The model version                                                                                                  |
| `options.input`                 | object   | **Required**. An object with the model's inputs                                                                                  |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the prediction has new output                                                          |
| `options.webhook_events_filter` | string[] | You can change which events trigger webhook requests by specifying webhook events (`start` \| `output` \| `logs` \| `completed`) |

```jsonc
{
  "id": "ufawqhfynnddngldkgtslldrkq",
  "version": "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  "urls": {
    "get": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    "cancel": "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  "created_at": "2022-04-26T22:13:06.224088Z",
  "started_at": null,
  "completed_at": null,
  "status": "succeeded",
  "input": {
    "text": "Alice"
  },
  "output": null,
  "error": null,
  "logs": null,
  "metrics": {}
}
```

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
  "created_at": "2022-04-26T22:13:06.224088Z",
  "started_at": null,
  "completed_at": null,
  "status": "starting",
  "input": {
    "text": "Alice"
  },
  "output": null,
  "error": null,
  "logs": null,
  "metrics": {}
}
```

### `replicate.predictions.list`

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
      "created_at": "2022-04-26T20:00:40.658234Z",
      "started_at": "2022-04-26T20:00:84.583803Z",
      "completed_at": "2022-04-26T20:02:27.648305Z",
      "source": "web",
      "status": "succeeded"
    }
    /* ... */
  ]
}
```

### `replicate.trainings.create`

```js
const response = await replicate.trainings.create(options);
```

| name                            | type     | description                                                                                                                      |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `options.version`               | string   | **Required**. The model version                                                                                                  |
| `options.destination`           | string   | **Required**. The destination for the trained version in the form `{username}/{model_name}`                                      |
| `options.input`                 | object   | **Required**. An object with the model's inputs                                                                                  |
| `options.webhook`               | string   | An HTTPS URL for receiving a webhook when the training has new output                                                            |
| `options.webhook_events_filter` | string[] | You can change which events trigger webhook requests by specifying webhook events (`start` \| `output` \| `logs` \| `completed`) |

```jsonc
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "version": "{version}",
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

### `replicate.trainings.get`

```js
const response = await replicate.trainings.get(training_id);
```

| name          | type   | description                   |
| ------------- | ------ | ----------------------------- |
| `training_id` | number | **Required**. The training id |

```jsonc
{
  "id": "zz4ibbonubfz7carwiefibzgga",
  "version": "{version}",
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
  "started_at": null,
  "created_at": "2023-03-28T21:47:58.566434Z",
  "completed_at": null
}
```

### `replicate.trainings.list`

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
      "created_at": "2022-04-26T20:00:40.658234Z",
      "started_at": "2022-04-26T20:00:84.583803Z",
      "completed_at": "2022-04-26T20:02:27.648305Z",
      "source": "web",
      "status": "succeeded"
    }
    /* ... */
  ]
}
```

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

```js
const response = await replicate.request(route, parameters);
```

| name                 | type   | description                                                  |
| -------------------- | ------ | ------------------------------------------------------------ |
| `options.route`      | string | Required. REST API endpoint path.                            |
| `options.parameters` | object | URL, query, and request body parameters for the given route. |

The `replicate.request()` method is used by the other methods
to interact with the Replicate API.
You can call this method directly to make other requests to the API.

## TypeScript

The `Replicate` constructor and all `replicate.*` methods are fully typed.
