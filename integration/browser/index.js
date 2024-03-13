import Replicate from "replicate";

/**
 * @param {string} - token the REPLICATE_API_TOKEN
 */
window.main = async (token) => {
  const replicate = new Replicate({ auth: token });
  const stream = replicate.stream(
    "replicate/canary:30e22229542eb3f79d4f945dacb58d32001b02cc313ae6f54eef27904edf3272",
    {
      input: {
        text: "Betty Browser",
      },
    }
  );

  const output = [];
  for await (const event of stream) {
    output.push(String(event));
  }
  return output.join("");
};
