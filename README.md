# Replicate JavaScript client

A JavaScript client for [Replicate](https://replicate.com/). It lets you run
models from Node.js and the web (coming soon!), and do various other things with
Replicate.

## Usage

Install with `npm install replicate`

Set your API token as an environment variable called `REPLICATE_API_TOKEN`.

To run a prediction and return its output:

```js
import replicate from "replicate";

const prediction = await replicate.version("<MODEL VERSION>").predict({
  prompt: "painting of a cat by andy warhol",
});

console.log(prediction.output);
// "https://replicate.delivery/pbxt/lGWovsQZ7jZuNtPvofMth1rSeCcVn5xes8dWWdWZ64MlTi7gA/out-0.png"
```

If you want to do something like updating progress while the prediction is
running, you can pass in an `onUpdate` callback function:

```js
import replicate from "replicate";

await replicate.version("<MODEL VERSION>").predict(
  {
    prompt: "painting of a cat by andy warhol",
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

const prediction = await replicate.version("<MODEL VERSION>").createPrediction({
  prompt: "painting of a cat by andy warhol",
});

console.log(prediction.status); // "starting"
```

From there, you can fetch the current status of the prediction using
`await prediction.load()` or `await replicate.prediction(prediction.id).load()`.

## License

[Apache 2.0](LICENSE)
