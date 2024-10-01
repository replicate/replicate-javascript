const Replicate = require("./");
const replicate = new Replicate({ useFileOutput: true });

(async function () {
  const input = {
    prompt:
      'black forest gateau cake spelling out the words "FLUX SCHNELL", tasty, food photography, dynamic shot',
    go_fast: true,
    megapixels: "1",
    num_outputs: 1,
    aspect_ratio: "1:1",
    output_format: "webp",
    output_quality: 80,
  };

  const start = performance.now();
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    wait: 0.0001,
    input,
  });

  const blob = await output[0].blob();
  console.log(
    "output",
    blob,
    "url",
    output[0].url(),
    "duration",
    performance.now() - start
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
