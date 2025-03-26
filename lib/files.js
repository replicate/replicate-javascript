/**
 * Create a file
 *
 * @param {object} file - Required. The file object.
 * @param {object} metadata - Optional. User-provided metadata associated with the file.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with the file data
 */
async function createFile(file, metadata = {}, { signal } = {}) {
  const form = new FormData();

  let filename;
  let blob;
  if (file instanceof Blob) {
    filename = file.name || `blob_${Date.now()}`;
    blob = file;
  } else if (Buffer.isBuffer(file)) {
    filename = `buffer_${Date.now()}`;
    const bytes = new Uint8Array(file);
    blob = new Blob([bytes], {
      type: "application/octet-stream",
      name: filename,
    });
  } else {
    throw new Error("Invalid file argument, must be a Blob, File or Buffer");
  }

  form.append("content", blob, filename);
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );

  const response = await this.request("/files", {
    method: "POST",
    data: form,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });

  return response.json();
}

/**
 * List all files
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with the files data
 */
async function listFiles({ signal } = {}) {
  const response = await this.request("/files", {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * Get a file
 *
 * @param {string} file_id - Required. The ID of the file.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with the file data
 */
async function getFile(file_id, { signal } = {}) {
  const response = await this.request(`/files/${file_id}`, {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * Delete a file
 *
 * @param {string} file_id - Required. The ID of the file.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<boolean>} - Resolves with true if the file was deleted
 */
async function deleteFile(file_id, { signal } = {}) {
  const response = await this.request(`/files/${file_id}`, {
    method: "DELETE",
    signal,
  });

  return response.status === 204;
}

module.exports = {
  create: createFile,
  list: listFiles,
  get: getFile,
  delete: deleteFile,
};
