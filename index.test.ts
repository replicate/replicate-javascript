import { expect, jest, test } from '@jest/globals';
import Replicate, { Prediction } from 'replicate';
import nock from 'nock';
import fetch from 'cross-fetch';

describe('Replicate client', () => {
  let client: Replicate;

  const BASE_URL = 'https://api.replicate.com/v1';

  beforeEach(() => {
    client = new Replicate({ auth: 'test-token' });
    client.fetch = fetch;
  });

  describe('constructor', () => {
    test('Sets default baseUrl', () => {
      expect(client.baseUrl).toBe('https://api.replicate.com/v1');
    });

    test('Sets custom baseUrl', () => {
      const clientWithCustomBaseUrl = new Replicate({
        baseUrl: 'https://example.com/',
        auth: 'test-token',
      });
      expect(clientWithCustomBaseUrl.baseUrl).toBe('https://example.com/');
    });

    test('Sets custom userAgent', () => {
      const clientWithCustomUserAgent = new Replicate({
        userAgent: 'my-app/1.2.3',
        auth: 'test-token',
      });
      expect(clientWithCustomUserAgent.userAgent).toBe('my-app/1.2.3');
    });
  });

  describe('collections.get', () => {
    test('Calls the correct API route', async () => {
      nock(BASE_URL).get('/collections/super-resolution').reply(200, {
        name: 'Super resolution',
        slug: 'super-resolution',
        description:
          'Upscaling models that create high-quality images from low-quality images.',
        models: [],
      });

      const collection = await client.collections.get('super-resolution');
      expect(collection.name).toBe('Super resolution');
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe('models.get', () => {
    test('Calls the correct API route', async () => {
      nock(BASE_URL).get('/models/replicate/hello-world').reply(200, {
        url: 'https://replicate.com/replicate/hello-world',
        owner: 'replicate',
        name: 'hello-world',
        description: 'A tiny model that says hello',
        visibility: 'public',
        github_url: 'https://github.com/replicate/cog-examples',
        paper_url: null,
        license_url: null,
        run_count: 12345,
        cover_image_url: '',
        default_example: {},
        latest_version: {},
      });

      await client.models.get('replicate', 'hello-world');
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.create', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .post('/predictions')
        .reply(200, {
          id: 'ufawqhfynnddngldkgtslldrkq',
          version:
            '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
          urls: {
            get: 'https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq',
            cancel:
              'https://api.replicate.com/v1/predictions/ufawqhfynnddngldkgtslldrkq/cancel',
          },
          created_at: '2022-04-26T22:13:06.224088Z',
          started_at: null,
          completed_at: null,
          status: 'starting',
          input: {
            text: 'Alice',
          },
          output: null,
          error: null,
          logs: null,
          metrics: {},
        });
      const prediction = await client.predictions.create({
        version:
          '5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
        input: {
          text: 'Alice',
        },
        webhook: 'http://test.host/webhook',
        webhook_events_filter: [ 'output', 'completed' ],
      });
      expect(prediction.id).toBe('ufawqhfynnddngldkgtslldrkq');
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.get', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .get('/predictions/rrr4z55ocneqzikepnug6xezpe')
        .reply(200, {
          id: 'rrr4z55ocneqzikepnug6xezpe',
          version:
            'be04660a5b93ef2aff61e3668dedb4cbeb14941e62a3fd5998364a32d613e35e',
          urls: {
            get: 'https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe',
            cancel:
              'https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe/cancel',
          },
          created_at: '2022-09-13T22:54:18.578761Z',
          started_at: '2022-09-13T22:54:19.438525Z',
          completed_at: '2022-09-13T22:54:23.236610Z',
          source: 'api',
          status: 'succeeded',
          input: {
            prompt: 'oak tree with boletus growing on its branches',
          },
          output: [
            'https://replicate.com/api/models/stability-ai/stable-diffusion/files/9c3b6fe4-2d37-4571-a17a-83951b1cb120/out-0.png',
          ],
          error: null,
          logs: 'Using seed: 36941...',
          metrics: {
            predict_time: 4.484541,
          },
        });
      const prediction = await client.predictions.get(
        'rrr4z55ocneqzikepnug6xezpe'
      );
      expect(prediction.id).toBe('rrr4z55ocneqzikepnug6xezpe');
    });
    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.list', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .get('/predictions')
        .reply(200, {
          next: 'https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw',
          previous: null,
          results: [
            {
              id: 'jpzd7hm5gfcapbfyt4mqytarku',
              version:
                'b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05',
              urls: {
                get: 'https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku',
                cancel:
                  'https://api.replicate.com/v1/predictions/jpzd7hm5gfcapbfyt4mqytarku/cancel',
              },
              created_at: '2022-04-26T20:00:40.658234Z',
              started_at: '2022-04-26T20:00:84.583803Z',
              completed_at: '2022-04-26T20:02:27.648305Z',
              source: 'web',
              status: 'succeeded',
            },
          ],
        });

      const predictions = await client.predictions.list();
      expect(predictions.results.length).toBe(1);
      expect(predictions.results[ 0 ].id).toBe('jpzd7hm5gfcapbfyt4mqytarku');
    });

    test('Paginates results', async () => {
      nock(BASE_URL)
        .get('/predictions')
        .reply(200, {
          results: [ { id: 'ufawqhfynnddngldkgtslldrkq' } ],
          next: 'https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw',
        })
        .get(
          '/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw'
        )
        .reply(200, {
          results: [ { id: 'rrr4z55ocneqzikepnug6xezpe' } ],
          next: null,
        });

      const results: Prediction[] = [];
      for await (const batch of client.paginate(client.predictions.list)) {
        results.push(...batch);
      }
      expect(results).toEqual([
        { id: 'ufawqhfynnddngldkgtslldrkq' },
        { id: 'rrr4z55ocneqzikepnug6xezpe' },
      ]);

      // Add more tests for error handling, edge cases, etc.
    });
  });

  describe('trainings.create', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .post(
          '/models/owner/model/versions/632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532/trainings'
        )
        .reply(200, {
          id: 'zz4ibbonubfz7carwiefibzgga',
          version: '{version}',
          status: 'starting',
          input: {
            text: '...',
          },
          output: null,
          error: null,
          logs: null,
          started_at: null,
          created_at: '2023-03-28T21:47:58.566434Z',
          completed_at: null,
        });

      const training = await client.trainings.create(
        'owner',
        'model',
        '632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532',
        {
          destination: 'new_owner/new_model',
          input: {
            text: '...',
          },
        }
      );
      expect(training.id).toBe('zz4ibbonubfz7carwiefibzgga');
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('trainings.get', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .get('/trainings/zz4ibbonubfz7carwiefibzgga')
        .reply(200, {
          id: 'zz4ibbonubfz7carwiefibzgga',
          version: '{version}',
          status: 'succeeded',
          input: {
            data: '...',
            param1: '...',
          },
          output: {
            version: '...',
          },
          error: null,
          logs: null,
          webhook_completed: null,
          started_at: null,
          created_at: '2023-03-28T21:47:58.566434Z',
          completed_at: null,
        });

      const training = await client.trainings.get('zz4ibbonubfz7carwiefibzgga');
      expect(training.status).toBe('succeeded');
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('trainings.cancel', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .post('/trainings/zz4ibbonubfz7carwiefibzgga/cancel')
        .reply(200, {
          id: 'zz4ibbonubfz7carwiefibzgga',
          version: '{version}',
          status: 'canceled',
          input: {
            data: '...',
            param1: '...',
          },
          output: {
            version: '...',
          },
          error: null,
          logs: null,
          webhook_completed: null,
          started_at: null,
          created_at: '2023-03-28T21:47:58.566434Z',
          completed_at: null,
        });

      const training = await client.trainings.cancel(
        'zz4ibbonubfz7carwiefibzgga'
      );
      expect(training.status).toBe('canceled');
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('trainings.list', () => {
    test('Calls the correct API route with the correct payload', async () => {
      nock(BASE_URL)
        .get('/trainings')
        .reply(200, {
          next: 'https://api.replicate.com/v1/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw',
          previous: null,
          results: [
            {
              id: 'jpzd7hm5gfcapbfyt4mqytarku',
              version:
                'b21cbe271e65c1718f2999b038c18b45e21e4fba961181fbfae9342fc53b9e05',
              urls: {
                get: 'https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku',
                cancel:
                  'https://api.replicate.com/v1/trainings/jpzd7hm5gfcapbfyt4mqytarku/cancel',
              },
              created_at: '2022-04-26T20:00:40.658234Z',
              started_at: '2022-04-26T20:00:84.583803Z',
              completed_at: '2022-04-26T20:02:27.648305Z',
              source: 'web',
              status: 'succeeded',
            },
          ],
        });

      const trainings = await client.trainings.list();
      expect(trainings.results.length).toBe(1);
      expect(trainings.results[ 0 ].id).toBe('jpzd7hm5gfcapbfyt4mqytarku');
    });

    test('Paginates results', async () => {
      nock(BASE_URL)
        .get('/trainings')
        .reply(200, {
          results: [ { id: 'ufawqhfynnddngldkgtslldrkq' } ],
          next: 'https://api.replicate.com/v1/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw',
        })
        .get(
          '/trainings?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw'
        )
        .reply(200, {
          results: [ { id: 'rrr4z55ocneqzikepnug6xezpe' } ],
          next: null,
        });

      const results: Prediction[] = [];
      for await (const batch of client.paginate(client.trainings.list)) {
        results.push(...batch);
      }
      expect(results).toEqual([
        { id: 'ufawqhfynnddngldkgtslldrkq' },
        { id: 'rrr4z55ocneqzikepnug6xezpe' },
      ]);

      // Add more tests for error handling, edge cases, etc.
    });
  });

  describe('run', () => {
    test('Calls the correct API routes', async () => {
      nock(BASE_URL)
        .post('/predictions')
        .reply(200, {
          id: 'ufawqhfynnddngldkgtslldrkq',
          status: 'processing',
        })
        .get('/predictions/ufawqhfynnddngldkgtslldrkq')
        .reply(200, {
          id: 'ufawqhfynnddngldkgtslldrkq',
          status: 'succeeded',
          output: 'foobar',
        });

      const output = await client.run(
        'owner/model:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
        {
          input: { text: 'Hello, world!' },
        }
      );
      expect(output).toBe('foobar');
    });
  });

  // Continue with tests for other methods
});
