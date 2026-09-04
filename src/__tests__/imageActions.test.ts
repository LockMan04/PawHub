// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  copyImageLink,
  copyImageToClipboard,
  shareImage,
  downloadImage,
} from "../core/images/actions";
import { catSiteConfig } from "../sites/cat/config";
import { dogSiteConfig } from "../sites/dog/config";

describe("Image Actions - Copy Link", () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("should successfully copy link using navigator.clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await copyImageLink("https://example.com/cat.jpg");
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("https://example.com/cat.jpg");
  });

  it("should fallback to execCommand when clipboard.writeText fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const result = await copyImageLink("https://example.com/dog.jpg");
    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });
});

describe("Image Actions - Copy Image To Clipboard", () => {
  const originalClipboard = navigator.clipboard;
  const originalClipboardItem = globalThis.ClipboardItem;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    globalThis.ClipboardItem = originalClipboardItem;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should copy png blob to clipboard when supported", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/png" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      })
    );

    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { write: writeMock },
      writable: true,
      configurable: true,
    });

    class MockClipboardItem {
      data: Record<string, Blob>;
      constructor(data: Record<string, Blob>) {
        this.data = data;
      }
    }
    globalThis.ClipboardItem = MockClipboardItem as unknown as typeof ClipboardItem;

    const result = await copyImageToClipboard("https://example.com/cat.png");
    expect(result.success).toBe(true);
    expect(result.type).toBe("image");
    expect(writeMock).toHaveBeenCalled();
  });

  it("should fallback to copyImageLink when clipboard write fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("CORS error")));

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await copyImageToClipboard("https://example.com/cat.jpg");
    expect(result.success).toBe(true);
    expect(result.type).toBe("link");
    expect(writeTextMock).toHaveBeenCalledWith("https://example.com/cat.jpg");
  });
});

describe("Image Actions - Share Image", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      value: originalShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("should use navigator.share when available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    const shareData = {
      title: "PawHub",
      text: "Check out this cat",
      url: "https://example.com/cat.jpg",
    };

    const result = await shareImage(shareData);
    expect(result.success).toBe(true);
    expect(result.method).toBe("share");
    expect(shareMock).toHaveBeenCalledWith(shareData);
  });

  it("should handle user cancel on share gracefully", async () => {
    const abortError = new Error("User canceled");
    abortError.name = "AbortError";
    const shareMock = vi.fn().mockRejectedValue(abortError);

    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    const result = await shareImage({
      title: "PawHub",
      text: "Check out this cat",
      url: "https://example.com/cat.jpg",
    });

    expect(result.success).toBe(false);
    expect(result.method).toBe("share");
  });

  it("should fallback to clipboard when navigator.share is unavailable", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await shareImage({
      title: "PawHub",
      text: "Check out this cat",
      url: "https://example.com/cat.jpg",
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe("clipboard");
    expect(writeTextMock).toHaveBeenCalledWith("https://example.com/cat.jpg");
  });
});

describe("Image Actions - Download Image", () => {
  beforeEach(() => {
    if (!window.URL) {
      window.URL = {} as unknown as typeof URL;
    }
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/test");
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch blob and trigger link download on success", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      })
    );

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");

    const result = await downloadImage("https://example.com/photo.jpg", "test-image.jpg");
    expect(result.success).toBe(true);
    expect(result.fallbackOpened).toBe(false);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should fallback to opening window when fetch fails (e.g. CORS)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("CORS blocked")));
    const openMock = vi.fn().mockReturnValue({ closed: false });
    window.open = openMock;

    const result = await downloadImage("https://example.com/photo.jpg", "test-image.jpg");
    expect(result.success).toBe(false);
    expect(result.fallbackOpened).toBe(true);
    expect(openMock).toHaveBeenCalledWith("https://example.com/photo.jpg", "_blank", "noopener,noreferrer");
  });

  it("should report fallbackOpened as false when window.open is blocked by browser", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("CORS blocked")));
    const openMock = vi.fn().mockReturnValue(null);
    window.open = openMock;

    const result = await downloadImage("https://example.com/photo.jpg", "test-image.jpg");
    expect(result.success).toBe(false);
    expect(result.fallbackOpened).toBe(false);
    expect(openMock).toHaveBeenCalledWith("https://example.com/photo.jpg", "_blank", "noopener,noreferrer");
  });
});

describe("Site Configuration Labels for Actions", () => {
  it("should have all action labels defined in catSiteConfig", () => {
    const labels = catSiteConfig.labels;
    expect(labels.copyLinkAction).toBe("Copy link");
    expect(labels.copyImageAction).toBe("Copy photo");
    expect(labels.copiedAction).toBe("Copied!");
    expect(labels.shareAction).toBe("Share cat");
    expect(labels.saveAction).toBe("Save cat");
    expect(labels.savingAction).toBe("Saving cat...");
    expect(labels.openOriginalAction).toBe("Open raw");
    expect(labels.closeModalAction).toBe("Close preview");
    expect(labels.viewImageAction("123")).toContain("123");
    expect(typeof labels.shareSuccessToast).toBe("string");
    expect(typeof labels.saveSuccessToast).toBe("string");
    expect(typeof labels.saveErrorToast).toBe("string");
    expect(typeof labels.copyImageSuccessToast).toBe("string");
    expect(typeof labels.copyImageFallbackToast).toBe("string");
    expect(typeof labels.downloadBlockedToast).toBe("string");
  });

  it("should have all action labels defined in dogSiteConfig", () => {
    const labels = dogSiteConfig.labels;
    expect(labels.copyLinkAction).toBe("Copy link");
    expect(labels.copyImageAction).toBe("Copy photo");
    expect(labels.copiedAction).toBe("Copied!");
    expect(labels.shareAction).toBe("Share dog");
    expect(labels.saveAction).toBe("Save dog");
    expect(labels.savingAction).toBe("Saving dog...");
    expect(labels.openOriginalAction).toBe("Open raw");
    expect(labels.closeModalAction).toBe("Close preview");
    expect(labels.viewImageAction("456")).toContain("456");
    expect(typeof labels.shareSuccessToast).toBe("string");
    expect(typeof labels.saveSuccessToast).toBe("string");
    expect(typeof labels.saveErrorToast).toBe("string");
    expect(typeof labels.copyImageSuccessToast).toBe("string");
    expect(typeof labels.copyImageFallbackToast).toBe("string");
    expect(typeof labels.downloadBlockedToast).toBe("string");
  });
});
