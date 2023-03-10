# Replicate Node.js client

A Node.js client for [Replicate](https://replicate.com/). It lets you run models from your Node.js apps and do various other things on Replicate.

## Status

**This is an early alpha. The implementation might change between versions
without warning. Please use at your own risk and pin to a specific version if
you're relying on this for anything important!**

## Usage

Install with `npm install replicate`

Set your API token as an environment variable called `REPLICATE_API_TOKEN`.

### Making preedictions

To run a prediction and return its output:

```js
import replicate from "replicate";

const prediction = await replicate
  .model(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
  )
  .predict({
    prompt: "an astronaut riding on a horse",
  });

console.log(prediction.output);
// "https://replicate.delivery/pbxt/nSREat5H54rxGJo1kk2xLLG2fpr0NBE0HBD5L0jszLoy8oSIA/out-0.png"
```

If you want to do something like updating progress while the prediction is
running, you can pass in an `onUpdate` callback function:

```js
import replicate from "replicate";

await replicate
  .model(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
  )
  .predict(
    {
      prompt: "an astronaut riding on a horse",
    },
    {
      onUpdate: (prediction) => {
        console.log(prediction.output);
      },
    }
  );
```

If you'd prefer to control your own polling you can use the low-level
`createPrediction()` method:

```js
import replicate from "replicate";

const prediction = await replicate
  .model(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
  )
  .createPrediction({
    prompt: "an astronaut riding on a horse",
  });

console.log(prediction.status); // "starting"
```

From there, you can fetch the current status of the prediction using
`await prediction.load()` or `await replicate.prediction(prediction.id).load()`.

#### Webhooks

You can also provide webhook configuration to have Replicate send POST requests
to your service when certain events occur:

```js
import replicate from "replicate";

await replicate
  .model(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
  )
  .createPrediction(
    {
      prompt: "an astronaut riding on a horse",
    },
    {
      // See https://replicate.com/docs/reference/http#create-prediction--webhook
      webhook: "https://your.host/webhook",

      // See https://replicate.com/docs/reference/http#create-prediction--webhook_events_filter
      webhookEventsFilter: ["output", "completed"],
    }
  );
```

## Contributing

While we'd love to accept contributions to this library, please open an issue
before starting any new work so we can discuss the approach we'd like to take
before you invest too much in writing code.

## License

[Apache 2.0](LICENSE)
