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

// Set your model's input parameters here
const input = {
  prompt: "painting of a cat by andy warhol",
};

const prediction = await replicate.predict("<MODEL VERSION>", input);

console.log(prediction.output);
// "https://replicate.delivery/pbxt/lGWovsQZ7jZuNtPvofMth1rSeCcVn5xes8dWWdWZ64MlTi7gA/out-0.png"
```

If you want to do something like updating progress while the prediction is
running, you can pass in an `onUpdate` callback function:

```js
import replicate from "replicate";

// Set your model's input parameters here
const input = {
  prompt: "painting of a cat by andy warhol",
};

await replicate.predict("<MODEL VERSION>", input, {
  onUpdate: (prediction) => {
    console.log(prediction.output);
  },
});
```

## License

[Apache 2.0](LICENSE)
