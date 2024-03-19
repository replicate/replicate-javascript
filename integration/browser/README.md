# Browser integration tests

Uses [`playwright`](https://playwright.dev/docs) to run a basic integration test against the three most common browser engines, Firefox, Chromium and WebKit.

It uses the `replicate/canary` model for the moment, which requires a Replicate API token available in the environment under `REPLICATE_API_TOKEN`.

The entire suite is a single `main()` function that calls a single model exercising the streaming API.

The test uses `esbuild` within the test generate a browser friendly version of the `index.js` file which is loaded into the given browser and calls the `main()` function asserting the response content.

## CORS

The Replicate API doesn't support Cross Origin Resource Sharing at this time. We work around this in Playwright by intercepting the request in a `page.route` handler. We don't modify the request/response, but this seems to work around the restriction.

## Setup

    npm install

## Local

The following command will run the tests across all browsers.

    npm test

To run against the default browser (chromium) run:

    npm exec playwright test

Or, specify a browser with:

    npm exec playwright test --browser firefox

## Debugging

Running `playwright test` with the `--debug` flag opens a browser window with a debugging interface, and a breakpoint set at the start of the test. It can also be connected directly to VSCode.

    npm exec playwright test --debug

The browser.js file is injected into the page via a script tag, to be able to set breakpoints in this file you'll need to use a `debugger` statement and open the devtools in the spawned browser window before continuing the test suite.
