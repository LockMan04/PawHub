export function combineSignals(
  timeoutMs = 8000,
  externalSignal?: AbortSignal
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!externalSignal) return timeoutSignal;
  return AbortSignal.any([timeoutSignal, externalSignal]);
}

export function formatFetchError(err: unknown, serviceName = "API"): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError") {
      return `Request to ${serviceName} timed out (8s).`;
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      return "Network connection error. Check your internet connection.";
    }
    return err.message;
  }
  return "Unknown network error";
}
