const Replicate = require('./index');
require('jest');

describe('Replicate client', () => {
  let client;
  beforeEach(() => {
    client = new Replicate({ baseUrl: 'https://api.replicate.com/v1' });
  });

  test('Constructor sets default baseUrl', () => {
    const clientWithoutBaseUrl = new Replicate({});
    expect(clientWithoutBaseUrl.baseUrl).toBe('https://api.replicate.com/v1');
  });

  describe('collections.get', () => {
    test('Calls the correct API route', async () => {
      client.request = jest.fn();
      await client.collections.get('text-to-image');
      expect(client.request).toHaveBeenCalledWith(
        '/collections/text-to-image',
        {
          method: 'GET',
        }
      );
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('models.get', () => {
    test('Calls the correct API route', async () => {
      client.request = jest.fn();
      await client.models.get('owner', 'name');
      expect(client.request).toHaveBeenCalledWith('/models/owner/name', {
        method: 'GET',
      });
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.create', () => {
    test('Calls the correct API route with the correct payload', async () => {
      client.request = jest.fn();
      const input = { text: 'Hello, world!' };
      await client.predictions.create({
        version:
          '632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532',
        input,
      });
      expect(client.request).toHaveBeenCalledWith('/predictions', {
        method: 'POST',
        data: {
          version:
            '632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532',
          input: {
            text: 'Hello, world!',
          },
        },
      });
    });

    test('Calls the correct API route with the correct payload, webhook URL and webhook filters', async () => {
      client.request = jest.fn();
      const input = { text: 'Hello, world!' };
      await client.predictions.create({
        version:
          '632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532',
        input,
        webhook: 'http://test.host/webhook',
        webhook_events_filter: ['output', 'completed'],
      });
      expect(client.request).toHaveBeenCalledWith('/predictions', {
        method: 'POST',
        data: {
          version:
            '632231d0d49d34d5c4633bd838aee3d81d936e59a886fbf28524702003b4c532',
          input: {
            text: 'Hello, world!',
          },
          webhook: 'http://test.host/webhook',
          webhook_events_filter: ['output', 'completed'],
        },
      });
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.get', () => {
    test('Calls the correct API route with the correct payload', async () => {
      client.request = jest.fn();
      await client.predictions.get(123);
      expect(client.request).toHaveBeenCalledWith('/predictions/123', {
        method: 'GET',
      });
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('predictions.list', () => {
    test('Calls the correct API route with the correct payload', async () => {
      client.request = jest.fn();
      await client.predictions.list();
      expect(client.request).toHaveBeenCalledWith('/predictions', {
        method: 'GET',
      });
    });

    test('Paginates results', async () => {
      client.request = jest.fn();
      client.request.mockResolvedValueOnce({
        results: [{ id: 1 }, { id: 2 }],
        next: 'https://api.replicate.com/v1/predictions?cursor=cD0yMDIyLTAxLTIxKzIzJTNBMTglM0EyNC41MzAzNTclMkIwMCUzQTAw',
      });
      client.request.mockResolvedValueOnce({
        results: [{ id: 3 }],
        next: null,
      });

      const results = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const page of client.paginate(client.predictions.list)) {
        results.push(...page);
      }
      expect(client.request).toHaveBeenCalledTimes(2);
      expect(results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    // Add more tests for error handling, edge cases, etc.
  });

  describe('run', () => {
    test('Calls the correct API routes', async () => {
      client.request = jest.fn();
      client.request.mockResolvedValueOnce({
        status: 'processing',
        id: 'prediction-id',
      });
      client.request.mockResolvedValueOnce({
        status: 'succeeded',
        output: 'foobar',
      });
      const output = await client.run('owner/model:abc123', {
        input: { text: 'Hello, world!' },
      });
      expect(output).toBe('foobar');
    });
  });

  // Continue with tests for other methods
});
