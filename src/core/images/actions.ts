export async function copyImageLink(url: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Clipboard API failed, try legacy fallback
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

async function convertBlobToPng(blob: Blob): Promise<Blob> {
  if (typeof document === "undefined") {
    return blob;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext("2d");
          if (!ctx || typeof canvas.toBlob !== "function") {
            resolve(blob);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              resolve(pngBlob);
            } else {
              resolve(blob);
            }
          }, "image/png");
        } catch {
          resolve(blob);
        }
      };

      img.onerror = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        resolve(blob);
      };

      img.src = objectUrl;
    } catch {
      resolve(blob);
    }
  });
}

export interface CopyImageResult {
  success: boolean;
  type: "image" | "link";
}

export async function copyImageToClipboard(url: string): Promise<CopyImageResult> {
  if (typeof window === "undefined") {
    return { success: false, type: "link" };
  }

  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === "function"
  ) {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (response.ok) {
        const sourceBlob = await response.blob();
        let pngBlob = sourceBlob;
        if (sourceBlob.type !== "image/png") {
          pngBlob = await convertBlobToPng(sourceBlob);
        }

        const mimeType = pngBlob.type === "image/png" ? "image/png" : sourceBlob.type;
        await navigator.clipboard.write([
          new ClipboardItem({
            [mimeType]: pngBlob,
          }),
        ]);
        return { success: true, type: "image" };
      }
    } catch {
      // Clipboard write failed or blocked, fallback to link copy
    }
  }

  const linkCopied = await copyImageLink(url);
  return {
    success: linkCopied,
    type: "link",
  };
}

export interface ShareImageData {
  title: string;
  text: string;
  url: string;
}

export interface ShareResult {
  success: boolean;
  method: "share" | "clipboard" | "failed";
}

export async function shareImage(data: ShareImageData): Promise<ShareResult> {
  if (typeof window === "undefined") {
    return { success: false, method: "failed" };
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return { success: true, method: "share" };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, method: "share" };
      }
    }
  }

  const copied = await copyImageLink(data.url);
  return {
    success: copied,
    method: copied ? "clipboard" : "failed",
  };
}

export interface DownloadResult {
  success: boolean;
  fallbackOpened: boolean;
}

export async function downloadImage(url: string, filename: string): Promise<DownloadResult> {
  if (typeof window === "undefined") {
    return { success: false, fallbackOpened: false };
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1500);

    return { success: true, fallbackOpened: false };
  } catch {
    try {
      const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
      const fallbackOpened = Boolean(openedWindow && !openedWindow.closed);
      return { success: false, fallbackOpened };
    } catch {
      return { success: false, fallbackOpened: false };
    }
  }
}
