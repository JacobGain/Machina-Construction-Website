const form = document.querySelector<HTMLFormElement>('#contact-form');
const fileInput = document.querySelector<HTMLInputElement>('#file');
const fileList = document.querySelector<HTMLElement>('.file-list');
const feedback = document.querySelector<HTMLElement>('#form-feedback');
const submit = document.querySelector<HTMLButtonElement>('#contact-submit');

if (form && fileInput && fileList && feedback && submit) {
  const maxFiles = Number(form.dataset.maxFiles || 5);
  const maxFileSize = Number(form.dataset.maxFileSizeMb || 5) * 1024 * 1024;
  const maxTotalSize = Number(form.dataset.maxTotalSizeMb || 15) * 1024 * 1024;
  const allowedExtensions = /\.(pdf|jpe?g|png|webp)$/i;
  const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const mimeTypes = new Set(['application/pdf', ...imageTypes]);
  // This list is the source of truth. Clearing the chooser must not discard uploads.
  let attachments: File[] = [];
  let preparing = false;
  let sending = false;
  const initialType = new URLSearchParams(window.location.search).get('type');
  const type = form.querySelector<HTMLSelectElement>('#type');
  if (initialType === 'Application' && type) type.value = initialType;
  form.noValidate = true;

  function message(text: string, success = false) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    feedback!.replaceChildren(paragraph);
    feedback!.hidden = false;
    feedback!.classList.toggle('is-success', success);
    feedback!.classList.toggle('is-error', !success);
  }

  function clearMessage() {
    feedback!.hidden = true;
    feedback!.replaceChildren();
  }

  function updateBusy() {
    submit!.disabled = preparing || sending;
    fileInput!.disabled = preparing || sending;
    submit!.textContent = preparing ? 'Preparing files...' : sending ? 'Sending...' : 'Send Message';
    form!.setAttribute('aria-busy', String(preparing || sending));
    fileList!.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = preparing || sending;
    });
  }

  function sizeLabel(bytes: number) {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderAttachments() {
    fileList!.replaceChildren();
    attachments.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      const name = document.createElement('span');
      name.textContent = `${file.name} (${sizeLabel(file.size)})`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-file';
      remove.textContent = 'x';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.addEventListener('click', () => {
        attachments.splice(index, 1);
        renderAttachments();
        clearMessage();
        const nextButton = fileList!.querySelectorAll<HTMLButtonElement>('button')[Math.min(index, attachments.length - 1)];
        (nextButton || fileInput!).focus();
      });
      item.append(name, remove);
      fileList!.append(item);
    });
  }

  async function compress(file: File): Promise<File> {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      try { await image.decode(); }
      catch { throw new Error(`"${file.name}" could not be processed as an image.`); }
      const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Image compression is not supported in this browser.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const encode = (quality: number) => new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image compression failed.')), 'image/jpeg', quality);
      });
      let blob = await encode(0.9);
      let low = 0.68;
      let high = 0.9;
      if (blob.size > maxFileSize) {
        // Start with the lowest acceptable quality so a valid result is retained.
        blob = await encode(low);
        if (blob.size > maxFileSize) throw new Error(`"${file.name}" is still above ${form!.dataset.maxFileSizeMb} MB after compression.`);
        for (let i = 0; i < 7; i++) {
          const quality = (low + high) / 2;
          const candidate = await encode(quality);
          if (candidate.size <= maxFileSize) { blob = candidate; low = quality; }
          else high = quality;
        }
      }
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  fileInput.addEventListener('change', async () => {
    if (preparing || sending) return;
    const selected = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (!selected.length) return;
    clearMessage();
    preparing = true;
    updateBusy();
    const combined = [...attachments];
    const errors: string[] = [];
    try {
      for (const file of selected) {
        if (!allowedExtensions.test(file.name) || (file.type && !mimeTypes.has(file.type))) {
          errors.push(`"${file.name}" is not an accepted file type. Use PDF, JPG, JPEG, PNG, or WEBP.`);
          continue;
        }
        if (combined.length >= maxFiles) {
          errors.push(`You can upload up to ${maxFiles} files per submission.`);
          break;
        }
        let normalized: File;
        try { normalized = file.size > maxFileSize && imageTypes.has(file.type) ? await compress(file) : file; }
        catch (error) { errors.push(error instanceof Error ? error.message : 'One or more files could not be prepared for upload.'); continue; }
        if (normalized.size > maxFileSize) {
          errors.push(`"${normalized.name}" exceeds the ${form.dataset.maxFileSizeMb} MB per-file limit.`);
          continue;
        }
        if (combined.reduce((total, item) => total + item.size, normalized.size) > maxTotalSize) {
          errors.push(`The selected files exceed the ${form.dataset.maxTotalSizeMb} MB total upload limit.`);
          continue;
        }
        combined.push(normalized);
      }
      attachments = combined;
      renderAttachments();
      if (errors.length) message(errors.join(' '));
    } finally {
      preparing = false;
      updateBusy();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (preparing || sending) return;
    clearMessage();
    if (!form.reportValidity()) {
      message('Please complete all required fields before sending your message.');
      return;
    }
    const endpoint = form.getAttribute('action');
    if (!endpoint) { message('The contact form endpoint has not been configured yet.'); return; }
    // Read text fields before disabling controls; append the prepared files explicitly.
    const body = new FormData(form);
    body.delete('attachments');
    attachments.forEach((file) => body.append('attachments', file, file.name));
    sending = true;
    updateBusy();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: controller.signal });
      const isJSON = response.headers.get('content-type')?.includes('application/json');
      const payload = isJSON ? await response.json() as { message?: string } : null;
      if (!response.ok || !isJSON || !payload?.message) {
        throw new Error(payload?.message || 'Your message could not be sent. Please try again later.');
      }
      form.reset();
      attachments = [];
      renderAttachments();
      message('Thanks for reaching out. Your message has been sent successfully.', true);
    } catch (error) {
      message(error instanceof Error && error.name !== 'AbortError' ? error.message : 'Your message could not be sent. Please try again later.');
    } finally {
      clearTimeout(timeout);
      sending = false;
      updateBusy();
    }
  });
}
