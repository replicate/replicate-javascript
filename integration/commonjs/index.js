const Replicate = require("replicate");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

module.exports = async function main() {
  const output = await replicate.run(
    "replicate/canary:30e22229542eb3f79d4f945dacb58d32001b02cc313ae6f54eef27904edf3272",
    {
      input: {
        text: "Claire CommonJS",
      },
    }
  );
  return output.join("").trim();
};
