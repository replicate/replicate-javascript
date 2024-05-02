import { test, expect } from "@playwright/test";
import { build } from "esbuild";

// Convert the source file from commonjs to a browser script.
const result = await build({
  entryPoints: ["index.js"],
  bundle: true,
  platform: "browser",
  external: ["crypto"],
  write: false,
});
const source = new TextDecoder().decode(result.outputFiles[0].contents);

// https://playwright.dev/docs/network#modify-requests

test("browser", async ({ page }) => {
  // Patch the API endpoint to work around CORS for now.
  await page.route(
    "https://api.replicate.com/v1/predictions",
    async (route) => {
      // Fetch original response.
      const response = await route.fetch();
      // Add a prefix to the title.
      return route.fulfill({ response });
    }
  );

  await page.addScriptTag({ content: source });
  const result = await page.evaluate(
    (token) => window.main(token),
    [process.env.REPLICATE_API_TOKEN]
  );
  expect(result).toBe("hello there, Betty Browser");
});
