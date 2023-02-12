This is a design document for figuring out the design of the future JavaScript client for Replicate’s HTTP API. Let’s design the API here, before we write any code. README-driven development!

# `replicate`

> SDK for [Replicate’s REST API](https://replicate.com/docs/reference/http)

## Usage

Install with `npm install replicate`

Set your API token as `REPLICATE_API_TOKEN` in your environment.

To run a prediction and return its 

```jsx
import replicate from "@replicate/client";

let output = await replicate.predict({
  version: "<MODEL VERSION>",
  input: {
    // your model inputs need to be set here
    prompt: "painting of a cat by andy warhol",
  },
});

// "https://replicate.delivery/pbxt/lGWovsQZ7jZuNtPvofMth1rSeCcVn5xes8dWWdWZ64MlTi7gA/out-0.png"
```

Or, you can run a prediction in the background to do more advanced stuff:

```jsx
let prediction = await replicate.predictions.create({
  version: "<MODEL VERSION>",
  input: {
    prompt: "painting of a cat by andy warhol",
  },
});

prediction.status
// "starting"

await prediction.reload()
prediction.status
// "processing"

prediction.logs
// Using seed: 53168
//  0%|          | 0/50 [00:00<?, ?it/s]
//  2%|▏         | 1/50 [00:00<00:12,  3.83it/s]
// ...

await prediction.wait()

prediction.status
// "succeeded"

prediction.output
// "https://replicate.delivery/pbxt/lGWovsQZ7jZuNtPvofMth1rSeCcVn5xes8dWWdWZ64MlTi7gA/out-0.png"

```

## Features

- Implements best practices such as throttling requests
- Pagination
- Fully typed

## API

### Constructor

```jsx
const replicate = new Replicate(options);
```

| name              | type   | description                              |
| ----------------- | ------ | ---------------------------------------- |
| options.auth      | string | Required. API access token               |
| options.userAgent | string | Required. Identifier of your app         |
| options.baseUrl   | string | Defaults to https://api.replicate.com/v1 |

### `replicate.models.get`

```jsx
const response = await replicate.models.get(options);
```

| name                | type   | description                                                         |
| ------------------- | ------ | ------------------------------------------------------------------- |
| options.model_owner | string | Required. The name of the user or organization that owns the model. |
| options.model_name  | string | Required. The name of the model.                                    |

Example for `response.data`

```jsx
{
  url: "https://replicate.com/replicate/hello-world",
  owner: "replicate",
  name: "hello-world",
  description: "A tiny model that says hello",
  visibility: "public",
  github_url: "https://github.com/replicate/cog-examples",
  paper_url: null,
  license_url: null,
  latest_version: { /* ... */ }
}
```

### `replicate.models.listVersions`

```jsx
const response = await replicate.models.listVersions(options);
```

| name                | type   | description                                                         |
| ------------------- | ------ | ------------------------------------------------------------------- |
| options.model_owner | string | Required. The name of the user or organization that owns the model. |
| options.model_name  | string | Required. The name of the model.                                    |

Example for `response.data`

```jsx
{
  previous: null,
  next: null,
  results: [
    {
      id: "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
      created_at: "2022-04-26T19:29:04.418669Z",
      cog_version: "0.3.0",
      openapi_schema: { /* ... */ }
    },
    {
      id: "e2e8c39e0f77177381177ba8c4025421ec2d7e7d3c389a9b3d364f8de560024f",
      created_at: "2022-03-21T13:01:04.418669Z",
      cog_version: "0.3.0",
      openapi_schema: { /* ... */ }
    }
  ]
}
```

### `replicate.models.getVersion`

```jsx
const response = await replicate.models.getVersion(options);
```

| name                | type   | description                                                         |
| ------------------- | ------ | ------------------------------------------------------------------- |
| options.model_owner | string | Required. The name of the user or organization that owns the model. |
| options.model_name  | string | Required. The name of the model.                                    |
| options.id          | string | Required. The model version                                         |

Example for `response.data`

```jsx
{
  id: "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  created_at: "2022-04-26T19:29:04.418669Z",
  cog_version: "0.3.0",
  openapi_schema: { /* ... */ }
}
```

### `replicate.models.getCollection`

```jsx
const response = await replicate.models.getCollection(options);
```

| name                    | type   | description                                                                |
| ----------------------- | ------ | -------------------------------------------------------------------------- |
| options.collection_slug | string | Required. The slug of the collection. See http://replicate.com/collections |

### `replicate.predictions.create`

```jsx
const response = await replicate.predictions.create(options);
```

| name                      | type   | description                                                               |
| ------------------------- | ------ | ------------------------------------------------------------------------- |
| options.version           | string | Required. The model version                                               |
| options.input             | object | Required. An object with the models inputs                                |
| options.webhook_completed | string | A URL which will receive a POST request upon completion of the prediction |

Example for `response.data`

```jsx
{
  id: "ufawqhfynnddngldkgtslldrkq",
  version: "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  urls: {
    get: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    cancel: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  created_at: "2022-04-26T22:13:06.224088Z",
  started_at: null,
  completed_at: null,
  status: "succeeded",
  input: {
    text: "Alice"
  },
  output: null,
  error: null,
  logs: null,
  metrics: {}
}
```

### `replicate.predictions.get`

```jsx
const response = await replicate.predictions.get(options);
```

| name                 | type   | description |
| -------------------- | ------ | ----------- |
| options.predictionId | string | Required.   |

Example for `response.data`

```jsx
{
  id: "ufawqhfynnddngldkgtslldrkq",
  version: "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
  urls: {
    get: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
    cancel: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel"
  },
  created_at: "2022-04-26T22:13:06.224088Z",
  started_at: null,
  completed_at: null,
  status: "starting",
  input: {
    text: "Alice"
  },
  output: null,
  error: null,
  logs: null,
  metrics: {}
}
```

### `replicate.predictions.list`

```jsx
const response = await replicate.predictions.list();
```

`replicate.predictions.list()` has no options.

Example for `response.data`

```jsx
{
  previous: null,
  next: "https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
  results: [
    {
      id: "jpzd7hm5gfcapbfyt4mqytarku",
      version: "b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05",
      urls: {
        get: "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku",
        cancel: "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku/cancel"
      },
      created_at: "2022-04-26T20:00:40.658234Z",
      started_at: "2022-04-26T20:00:84.583803Z",
      completed_at: "2022-04-26T20:02:27.648305Z",
      source: "web",
      status: "succeeded"
    },
    /* ... */
  ]
}
```

### `replicate.paginate`

```jsx
const result = await replicate.paginate(replicate.predictions.list);
```

Auto-paginates the passed in endpoint and resolves with an array of all results

### `replicate.paginate.iterator`

```jsx
const asyncIterator = replicate.paginate.iterator(replicate.predictions.list);
```

Same as `replicate.paginate` but can be used as async iterator, e.g.

```jsx
for await (const response of replicate.paginate.iterator(
  replicate.predictions.list
)) {
  /* do something with response */
}
```

### `replicate.request`

```jsx
const response = await replicate.request(route, parameters);
```

| name               | type   | description                                                  |
| ------------------ | ------ | ------------------------------------------------------------ |
| options.route      | string | Required. REST API endpoint path.                            |
| options.parameters | object | URL, query, and request body parameters for the given route. |

The `replicate.request()` method is used under the hood of the other request methods and can be utilized to try out experimental endpoints that have not been documented yet.

## TypeScript

The `Replicate` constructor and all `replicate.*` methods are fully typed.

In order to get types for prediction inputs which depend on model versions, you can extend the `Replicate.ModelInputsByVersion` interface in one of two ways

### 1. Install type packages from URLs

Import types for JS/TS usage is to make dynamic type packages installable from the API. For example

```bash
npm install --save-dev https://api.replicate.com/v1/models/{model_owner}/{model_name}/{version}.tar.gz
```

Because the package name begins with `@types/` the typescript language server in VS Code recognizes it automatically. Packages can be installed for multiple models/versions.

### 2. Define types manually

The types for each model version can be defined manually in a `replicate-models.d.ts` file that is located in your projects’ root path

```bash
import { Replicate } from "replicate";

declare module "replicate-testing" {
  namespace Replicate {
    interface ModelInputsByVersion {
      affe44672e418f636f9a5cf2e6f9632404a83d692e42ecfa3f3010e467b80659: {
        prompt: string;
      };
    }
  }
}
```

The types can be imported in JS files with a triple slash directives (must be the first line in the file)

```bash
/// <reference path="./replicate-models.d.ts" />
```

In TS files the types will be imported automatically when the file lives in the project root.

## Contributing

See [CONTRIBUTING.md](https://example.com)

## License

[Apache 2.0](LICENSE)
