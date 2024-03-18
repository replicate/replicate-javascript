import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function main() {
  const model = "meta/llama-2-70b-chat";
  const options = {
    input: {
      prompt: "Write a poem about steam buns",
    },
  };
  const output = [];

  for await (const { event, data } of replicate.stream(model, options)) {
    if (event === "output") {
      output.push(data);
    }
  }

  return output.join("").trim();
}
