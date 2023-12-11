import { expect, jest, test } from "@jest/globals";
import Replicate, { ApiError, Model, Prediction } from "replicate";
import nock from "nock";
import fetch from "cross-fetch";

let client: Replicate;
const BASE_URL = "https://api.replicate.com/v1";

nock.disableNetConnect();

describe("Replicate client", () => {
  let unmatched: any[] = [];
  const handleNoMatch = (req: unknown, options: any, body: string) =>
    unmatched.push({ req, options, body });

  beforeEach(() => {
    client = new Replicate({ auth: "test-token" });
    client.fetch = fetch;

    unmatched = [];
    nock.emitter.on("no match", handleNoMatch);
  });

  afterEach(() => {
    nock.emitter.off("no match", handleNoMatch);
    expect(unmatched).toStrictEqual([]);

    nock.abortPendingRequests();
    nock.cleanAll();
  });

  describe("constructor", () => {
    test("Sets default baseUrl", () => {
      expect(client.baseUrl).toBe("https://api.replicate.com/v1");
    });

    test("Sets custom baseUrl", () => {
      const clientWithCustomBaseUrl = new Replicate({
        baseUrl: "https://example.com/",
        auth: "test-token",
      });
      expect(clientWithCustomBaseUrl.baseUrl).toBe("https://example.com/");
    });

    test("Sets custom userAgent", () => {
      const clientWithCustomUserAgent = new Replicate({
        userAgent: "my-app/1.2.3",
        auth: "test-token",
      });
      expect(clientWithCustomUserAgent.userAgent).toBe("my-app/1.2.3");
    });

    test("Does not throw error if auth token is not provided", () => {
      process.env.REPLICATE_API_TOKEN = "test-token";

      expect(() => {
        const clientWithImplicitAuth = new Replicate();

        expect(clientWithImplicitAuth.auth).toBe("test-token");
      }).not.toThrow();
    });

    test("Does not throw error if blank auth token is provided", () => {
      expect(() => {
        new Replicate({ auth: "" });
      }).not.toThrow();
    });
  });

  describe("collections.list", () => {
    test("Calls the correct API route", async () => {
      nock(BASE_URL)
        .get("/collections")
        .reply(200, {
          results: [
            {
              name: "Super resolution",
              slug: "super-resolution",
              description:
                "Upscaling models that create high-quality images from low-quality images.",
            },
            {
              name: "Image classification",
              slug: "image-classification",
              description: "Models that classify images.",
            },
          ],
          next: null,
          previous: null,
        });

      const collections = await client.collections.list();
      expect(collections.results.length).toBe(2);
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("collections.get", () => {
    test("Calls the correct API route", async () => {
      nock(BASE_URL).get("/collections/super-resolution").reply(200, {
        name: "Super resolution",
        slug: "super-resolution",
        description:
          "Upscaling models that create high-quality images from low-quality images.",
        models: [],
      });

      const collection = await client.collections.get("super-resolution");
      expect(collection.name).toBe("Super resolution");
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("models.get", () => {
    test("Calls the correct API route", async () => {
      nock(BASE_URL).get("/models/replicate/hello-world").reply(200, {
        url: "https://replicate.com/replicate/hello-world",
        owner: "replicate",
        name: "hello-world",
        description: "A tiny model that says hello",
        visibility: "public",
        github_url: "https://github.com/replicate/cog-examples",
        paper_url: null,
        license_url: null,
        run_count: 12345,
        cover_image_url: "",
        default_example: {},
        latest_version: {},
      });

      await client.models.get("replicate", "hello-world");
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("models.list", () => {
    test("Paginates results", async () => {
      nock(BASE_URL)
        .get("/models")
        .reply(200, {
          results: [{ url: "https://replicate.com/some-user/model-1" }],
          next: "https://api.replicate.com/v1/models?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
        })
        .get(
          "/models?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw"
        )
        .reply(200, {
          results: [{ url: "https://replicate.com/some-user/model-2" }],
          next: null,
        });

      const results: Model[] = [];
      for await (const batch of client.paginate(client.models.list)) {
        results.push(...batch);
      }
      expect(results).toEqual([
        { url: "https://replicate.com/some-user/model-1" },
        { url: "https://replicate.com/some-user/model-2" },
      ]);

      // Add more tests for error handling, edge cases, etc.
    });
  });

  describe("predictions.create", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post("/predictions")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          model: "replicate/hello-world",
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          urls: {
            get: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
            cancel:
              "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel",
          },
          created_at: "2022-04-26T22:13:06.224088Z",
          started_at: null,
          completed_at: null,
          status: "starting",
          input: {
            text: "Alice",
          },
          output: null,
          error: null,
          logs: null,
          metrics: {},
        });
      const prediction = await client.predictions.create({
        version:
          "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        input: {
          text: "Alice",
        },
        webhook: "http://test.host/webhook",
        webhook_events_filter: ["output", "completed"],
      });
      expect(prediction.id).toBe("ufawqhfynnddngldkgtslldrkq");
    });

    test("Passes stream parameter to API endpoint", async () => {
      nock(BASE_URL)
        .post("/predictions")
        .reply(201, (_uri, body) => {
          expect((body as any).stream).toBe(true);
          return body;
        });

      await client.predictions.create({
        version:
          "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        input: {
          prompt: "Tell me a story",
        },
        stream: true,
      });
    });

    test("Throws an error if webhook URL is invalid", async () => {
      await expect(async () => {
        await client.predictions.create({
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          input: {
            text: "Alice",
          },
          webhook: "invalid-url",
        });
      }).rejects.toThrow("Invalid webhook URL");
    });

    test("Throws an error with details failing response is JSON", async () => {
      nock(BASE_URL).post("/predictions").reply(
        400,
        {
          status: 400,
          detail: "Invalid input",
        },
        { "Content-Type": "application/json" }
      );

      try {
        expect.hasAssertions();

        await client.predictions.create({
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          input: {
            text: null,
          },
        });
      } catch (error) {
        expect((error as ApiError).response.status).toBe(400);
        expect((error as ApiError).message).toContain("Invalid input");
      }
    });

    test("Automatically retries on 429", async () => {
      nock(BASE_URL)
        .post("/predictions")
        .reply(
          429,
          {
            detail: "Too many requests",
          },
          { "Content-Type": "application/json", "Retry-After": "1" }
        )
        .post("/predictions")
        .reply(201, {
          id: "ufawqhfynnddngldkgtslldrkq",
        });
      const prediction = await client.predictions.create({
        version:
          "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        input: {
          text: "Alice",
        },
      });
      expect(prediction.id).toBe("ufawqhfynnddngldkgtslldrkq");
    });

    test("Does not automatically retry on 500", async () => {
      nock(BASE_URL).post("/predictions").reply(
        500,
        {
          detail: "Internal server error",
        },
        { "Content-Type": "application/json" }
      );

      await expect(
        client.predictions.create({
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          input: {
            text: "Alice",
          },
        })
      ).rejects.toThrow(
        `Request to https://api.replicate.com/v1/predictions failed with status 500 Internal Server Error: {"detail":"Internal server error"}.`
      );
    });
  });

  describe("predictions.get", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .get("/predictions/rrr4z55ocneqzikepnug6xezpe")
        .reply(200, {
          id: "rrr4z55ocneqzikepnug6xezpe",
          model: "stability-ai/stable-diffusion",
          version:
            "be04660a5b93ef2aff61e3668dedb4cbeb14941e62a3fd5998364a32d613e35e",
          urls: {
            get: "https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe",
            cancel:
              "https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe/cancel",
          },
          created_at: "2022-09-13T22:54:18.578761Z",
          started_at: "2022-09-13T22:54:19.438525Z",
          completed_at: "2022-09-13T22:54:23.236610Z",
          source: "api",
          status: "succeeded",
          input: {
            prompt: "oak tree with boletus growing on its branches",
          },
          output: [
            "https://replicate.com/api/models/stability-ai/stable-diffusion/files/9c3b6fe4-2d37-4571-a17a-83951b1cb120/out-0.png",
          ],
          error: null,
          logs: "Using seed: 36941...",
          metrics: {
            predict_time: 4.484541,
          },
        });
      const prediction = await client.predictions.get(
        "rrr4z55ocneqzikepnug6xezpe"
      );
      expect(prediction.id).toBe("rrr4z55ocneqzikepnug6xezpe");
    });

    test("Automatically retries on 429", async () => {
      nock(BASE_URL)
        .get("/predictions/rrr4z55ocneqzikepnug6xezpe")
        .reply(
          429,
          {
            detail: "Too many requests",
          },
          { "Content-Type": "application/json", "Retry-After": "1" }
        )
        .get("/predictions/rrr4z55ocneqzikepnug6xezpe")
        .reply(200, {
          id: "rrr4z55ocneqzikepnug6xezpe",
        });

      const prediction = await client.predictions.get(
        "rrr4z55ocneqzikepnug6xezpe"
      );
      expect(prediction.id).toBe("rrr4z55ocneqzikepnug6xezpe");
    });

    test("Automatically retries on 500", async () => {
      nock(BASE_URL)
        .get("/predictions/rrr4z55ocneqzikepnug6xezpe")
        .reply(
          500,
          {
            detail: "Internal server error",
          },
          { "Content-Type": "application/json" }
        )
        .get("/predictions/rrr4z55ocneqzikepnug6xezpe")
        .reply(200, {
          id: "rrr4z55ocneqzikepnug6xezpe",
        });

      const prediction = await client.predictions.get(
        "rrr4z55ocneqzikepnug6xezpe"
      );
      expect(prediction.id).toBe("rrr4z55ocneqzikepnug6xezpe");
    });
  });

  describe("predictions.cancel", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post("/predictions/ufawqhfynnddngldkgtslldrkq/cancel")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          model: "replicate/hello-world",
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          urls: {
            get: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
            cancel:
              "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel",
          },
          created_at: "2022-04-26T22:13:06.224088Z",
          started_at: "2022-04-26T22:13:06.224088Z",
          completed_at: "2022-04-26T22:14:06.224088Z",
          status: "canceled",
          input: {
            text: "Alice",
          },
          output: null,
          error: null,
          logs: null,
          metrics: {},
        });

      const prediction = await client.predictions.cancel(
        "ufawqhfynnddngldkgtslldrkq"
      );
      expect(prediction.status).toBe("canceled");
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe("predictions.list", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .get("/predictions")
        .reply(200, {
          next: "https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
          previous: null,
          results: [
            {
              id: "jpzd7hm5gfcapbfyt4mqytarku",
              model: "stability-ai/stable-diffusion",
              version:
                "b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05",
              urls: {
                get: "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku",
                cancel:
                  "https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku/cancel",
              },
              created_at: "2022-04-26T20:00:40.658234Z",
              started_at: "2022-04-26T20:00:84.583803Z",
              completed_at: "2022-04-26T20:02:27.648305Z",
              source: "web",
              status: "succeeded",
            },
          ],
        });

      const predictions = await client.predictions.list();
      expect(predictions.results.length).toBe(1);
      expect(predictions.results[0].id).toBe("jpzd7hm5gfcapbfyt4mqytarku");
    });

    test("Paginates results", async () => {
      nock(BASE_URL)
        .get("/predictions")
        .reply(200, {
          results: [{ id: "ufawqhfynnddngldkgtslldrkq" }],
          next: "https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
        })
        .get(
          "/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw"
        )
        .reply(200, {
          results: [{ id: "rrr4z55ocneqzikepnug6xezpe" }],
          next: null,
        });

      const results: Prediction[] = [];
      for await (const batch of client.paginate(client.predictions.list)) {
        results.push(...batch);
      }
      expect(results).toEqual([
        { id: "ufawqhfynnddngldkgtslldrkq" },
        { id: "rrr4z55ocneqzikepnug6xezpe" },
      ]);

      // Add more tests for error handling, edge cases, etc.
    });
  });

  describe("trainings.create", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post(
          "/models/owner/model/versions/632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532/trainings"
        )
        .reply(200, {
          id: "zz4ibbonubfz7carwiefibzgga",
          version:
            "632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532",
          status: "starting",
          input: {
            text: "...",
          },
          output: null,
          error: null,
          logs: null,
          started_at: null,
          created_at: "2023-03-28T21:47:58.566434Z",
          completed_at: null,
        });

      const training = await client.trainings.create(
        "owner",
        "model",
        "632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532",
        {
          destination: "new_owner/new_model",
          input: {
            text: "...",
          },
        }
      );
      expect(training.id).toBe("zz4ibbonubfz7carwiefibzgga");
    });

    test("Throws an error if webhook is not a valid URL", async () => {
      await expect(
        client.trainings.create(
          "owner",
          "model",
          "632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532",
          {
            destination: "new_owner/new_model",
            input: {
              text: "...",
            },
            webhook: "invalid-url",
          }
        )
      ).rejects.toThrow("Invalid webhook URL");
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe("trainings.get", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .get("/trainings/zz4ibbonubfz7carwiefibzgga")
        .reply(200, {
          id: "zz4ibbonubfz7carwiefibzgga",
          version: "{version}",
          status: "succeeded",
          input: {
            data: "...",
            param1: "...",
          },
          output: {
            version: "...",
          },
          error: null,
          logs: null,
          webhook_completed: null,
          started_at: null,
          created_at: "2023-03-28T21:47:58.566434Z",
          completed_at: null,
        });

      const training = await client.trainings.get("zz4ibbonubfz7carwiefibzgga");
      expect(training.status).toBe("succeeded");
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe("trainings.cancel", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post("/trainings/zz4ibbonubfz7carwiefibzgga/cancel")
        .reply(200, {
          id: "zz4ibbonubfz7carwiefibzgga",
          version: "{version}",
          status: "canceled",
          input: {
            data: "...",
            param1: "...",
          },
          output: {
            version: "...",
          },
          error: null,
          logs: null,
          webhook_completed: null,
          started_at: null,
          created_at: "2023-03-28T21:47:58.566434Z",
          completed_at: null,
        });

      const training = await client.trainings.cancel(
        "zz4ibbonubfz7carwiefibzgga"
      );
      expect(training.status).toBe("canceled");
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe("trainings.list", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .get("/trainings")
        .reply(200, {
          next: "https://api.replicate.com/v1/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
          previous: null,
          results: [
            {
              id: "jpzd7hm5gfcapbfyt4mqytarku",
              model: "stability-ai/sdxl",
              version:
                "b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05",
              urls: {
                get: "https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku",
                cancel:
                  "https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku/cancel",
              },
              created_at: "2022-04-26T20:00:40.658234Z",
              started_at: "2022-04-26T20:00:84.583803Z",
              completed_at: "2022-04-26T20:02:27.648305Z",
              source: "web",
              status: "succeeded",
            },
          ],
        });

      const trainings = await client.trainings.list();
      expect(trainings.results.length).toBe(1);
      expect(trainings.results[0].id).toBe("jpzd7hm5gfcapbfyt4mqytarku");
    });

    test("Paginates results", async () => {
      nock(BASE_URL)
        .get("/trainings")
        .reply(200, {
          results: [{ id: "ufawqhfynnddngldkgtslldrkq" }],
          next: "https://api.replicate.com/v1/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw",
        })
        .get(
          "/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw"
        )
        .reply(200, {
          results: [{ id: "rrr4z55ocneqzikepnug6xezpe" }],
          next: null,
        });

      const results: Prediction[] = [];
      for await (const batch of client.paginate(client.trainings.list)) {
        results.push(...batch);
      }
      expect(results).toEqual([
        { id: "ufawqhfynnddngldkgtslldrkq" },
        { id: "rrr4z55ocneqzikepnug6xezpe" },
      ]);

      // Add more tests for error handling, edge cases, etc.
    });
  });

  describe("deployments.predictions.create", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post("/deployments/replicate/greeter/predictions")
        .reply(200, {
          id: "mfrgcyzzme2wkmbwgzrgmntcg",
          model: "replicate/hello-world",
          version:
            "5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          urls: {
            get: "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq",
            cancel:
              "https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel",
          },
          created_at: "2022-09-10T09:44:22.165836Z",
          started_at: null,
          completed_at: null,
          status: "starting",
          input: {
            text: "Alice",
          },
          output: null,
          error: null,
          logs: null,
          metrics: {},
        });
      const prediction = await client.deployments.predictions.create(
        "replicate",
        "greeter",
        {
          input: {
            text: "Alice",
          },
          webhook: "http://test.host/webhook",
          webhook_events_filter: ["output", "completed"],
        }
      );
      expect(prediction.id).toBe("mfrgcyzzme2wkmbwgzrgmntcg");
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("predictions.create with model", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL)
        .post("/models/meta/llama-2-70b-chat/predictions")
        .reply(200, {
          id: "heat2o3bzn3ahtr6bjfftvbaci",
          model: "replicate/lifeboat-70b",
          version: "d-c6559c5791b50af57b69f4a73f8e021c",
          input: {
            prompt: "Please write a haiku about llamas.",
          },
          logs: "",
          error: null,
          status: "starting",
          created_at: "2023-11-27T13:35:45.99397566Z",
          urls: {
            cancel:
              "https://api.replicate.com/v1/predictions/heat2o3bzn3ahtr6bjfftvbaci/cancel",
            get: "https://api.replicate.com/v1/predictions/heat2o3bzn3ahtr6bjfftvbaci",
          },
        });
      const prediction = await client.predictions.create({
        model: "meta/llama-2-70b-chat",
        input: {
          prompt: "Please write a haiku about llamas.",
        },
        webhook: "http://test.host/webhook",
        webhook_events_filter: ["output", "completed"],
      });
      expect(prediction.id).toBe("heat2o3bzn3ahtr6bjfftvbaci");
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("hardware.list", () => {
    test("Calls the correct API route", async () => {
      nock(BASE_URL)
        .get("/hardware")
        .reply(200, [
          { name: "CPU", sku: "cpu" },
          { name: "Nvidia T4 GPU", sku: "gpu-t4" },
          { name: "Nvidia A40 GPU", sku: "gpu-a40-small" },
          { name: "Nvidia A40 (Large) GPU", sku: "gpu-a40-large" },
        ]);

      const hardware = await client.hardware.list();
      expect(hardware.length).toBe(4);
      expect(hardware[0].name).toBe("CPU");
      expect(hardware[0].sku).toBe("cpu");
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe("models.create", () => {
    test("Calls the correct API route with the correct payload", async () => {
      nock(BASE_URL).post("/models").reply(200, {
        owner: "test-owner",
        name: "test-model",
        visibility: "public",
        hardware: "cpu",
        description: "A test model",
      });

      const model = await client.models.create("test-owner", "test-model", {
        visibility: "public",
        hardware: "cpu",
        description: "A test model",
      });

      expect(model.owner).toBe("test-owner");
      expect(model.name).toBe("test-model");
      expect(model.visibility).toBe("public");
      // expect(model.hardware).toBe('cpu');
      expect(model.description).toBe("A test model");
    });
  });

  describe("run", () => {
    test("Calls the correct API routes for a version", async () => {
      const firstPollingRequest = true;

      nock(BASE_URL)
        .post("/predictions")
        .reply(201, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "starting",
        })
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .twice()
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "processing",
        })
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "succeeded",
          output: "Goodbye!",
        });

      const progress = jest.fn();

      const output = await client.run(
        "owner/model:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        {
          input: { text: "Hello, world!" },
          wait: { interval: 1 },
        },
        progress
      );

      expect(output).toBe("Goodbye!");

      expect(progress).toHaveBeenNthCalledWith(1, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "starting",
      });

      expect(progress).toHaveBeenNthCalledWith(2, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "processing",
      });

      expect(progress).toHaveBeenNthCalledWith(3, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "processing",
      });

      expect(progress).toHaveBeenNthCalledWith(4, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "succeeded",
        output: "Goodbye!",
      });

      expect(progress).toHaveBeenCalledTimes(4);
    });

    test("Calls the correct API routes for a model", async () => {
      const firstPollingRequest = true;

      nock(BASE_URL)
        .post("/models/replicate/hello-world/predictions")
        .reply(201, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "starting",
        })
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .twice()
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "processing",
        })
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "succeeded",
          output: "Goodbye!",
        });

      const progress = jest.fn();

      const output = await client.run(
        "replicate/hello-world",
        {
          input: { text: "Hello, world!" },
          wait: { interval: 1 },
        },
        progress
      );

      expect(output).toBe("Goodbye!");

      expect(progress).toHaveBeenNthCalledWith(1, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "starting",
      });

      expect(progress).toHaveBeenNthCalledWith(2, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "processing",
      });

      expect(progress).toHaveBeenNthCalledWith(3, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "processing",
      });

      expect(progress).toHaveBeenNthCalledWith(4, {
        id: "ufawqhfynnddngldkgtslldrkq",
        status: "succeeded",
        output: "Goodbye!",
      });

      expect(progress).toHaveBeenCalledTimes(4);
    });

    test("Does not throw an error for identifier containing hyphen and full stop", async () => {
      nock(BASE_URL)
        .post("/predictions")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "processing",
        })
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "succeeded",
          output: "foobar",
        });

      await expect(
        client.run("a/b-1.0:abc123", { input: { text: "Hello, world!" } })
      ).resolves.not.toThrow();
    });

    test("Throws an error for invalid identifiers", async () => {
      const options = { input: { text: "Hello, world!" } };

      // @ts-expect-error
      await expect(client.run("owner:abc123", options)).rejects.toThrow();

      await expect(client.run("/model:abc123", options)).rejects.toThrow();

      // @ts-expect-error
      await expect(client.run(":abc123", options)).rejects.toThrow();
    });

    test("Throws an error if webhook URL is invalid", async () => {
      await expect(async () => {
        await client.run(
          "owner/model:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          {
            input: {
              text: "Alice",
            },
            webhook: "invalid-url",
          }
        );
      }).rejects.toThrow("Invalid webhook URL");
    });

    test("Aborts the operation when abort signal is invoked", async () => {
      const controller = new AbortController();
      const { signal } = controller;

      const scope = nock(BASE_URL)
        .post("/predictions", (body) => {
          controller.abort();
          return body;
        })
        .reply(201, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "processing",
        })
        .persist()
        .get("/predictions/ufawqhfynnddngldkgtslldrkq")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "processing",
        })
        .post("/predictions/ufawqhfynnddngldkgtslldrkq/cancel")
        .reply(200, {
          id: "ufawqhfynnddngldkgtslldrkq",
          status: "canceled",
        });

      await client.run(
        "owner/model:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        {
          input: { text: "Hello, world!" },
          signal,
        }
      );

      expect(signal.aborted).toBe(true);

      scope.done();
    });
  });

  // Continue with tests for other methods
});
