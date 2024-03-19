import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function main() {
  const model =
    "replicate/canary:30e22229542eb3f79d4f945dacb58d32001b02cc313ae6f54eef27904edf3272";
  const options = {
    input: {
      text: "Brünnhilde Bun",
    },
  };
  const output = [];

  for await (const { event, data } of replicate.stream(model, options)) {
    console.log({ event, data });
    if (event === "output") {
      output.push(data);
    }
  }

  return output.join("").trim();
}
