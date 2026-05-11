const MAX_DIM = 1600;
const JPEG_QUALITY = 0.85;

export function downscaleToJpeg(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          preview: dataUrl,
          base64: dataUrl.split(",")[1],
          mediaType: "image/jpeg",
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64, mediaType = "image/jpeg") {
  const byteString = atob(base64);
  const len = byteString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = byteString.charCodeAt(i);
  return new Blob([bytes], { type: mediaType });
}
