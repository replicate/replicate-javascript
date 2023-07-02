import Replicate from '.';

export async function requestTest() {
  const replicate = new Replicate({
    auth: '',
  });

  replicate.request('GET /v1/collections');

  // @ts-expect-error - unknown route
  replicate.request('GET /unknown');

  // @ts-expect-error - required arugments not passed
  replicate.request('POST /v1/models/{model_owner}/{model_name}/versions/{version_id}/trainings');

  replicate.request('POST /v1/models/{model_owner}/{model_name}/versions/{version_id}/trainings', {
    model_owner: 'test',
    model_name: 'test',
    version_id: 'test',

    // @ts-expect-error - unknown parameter
    unknown: 'test',
  });
}
