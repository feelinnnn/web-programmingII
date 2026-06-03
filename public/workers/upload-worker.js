// Web Worker — handles file upload in background thread
// so the main thread stays free for user typing

self.addEventListener('message', async (event) => {
  const { file, id } = event.data;

  if (!file || !id) {
    self.postMessage({ id, success: false, error: 'Missing file or id' });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file, file.name || 'upload');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }

    const { url } = await res.json();

    if (!url) {
      throw new Error('No URL returned from server');
    }

    self.postMessage({ id, url, success: true });
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: err.message || 'Unknown upload error',
    });
  }
});
