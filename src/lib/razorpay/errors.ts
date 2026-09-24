/**
 * The `razorpay` SDK throws a plain object (`{ statusCode, error }`) rather
 * than an `Error` on non-2xx responses, so `error.message` is undefined and
 * would otherwise be replaced by a generic fallback. Preserve the real reason.
 */
export function describeRazorpayError(fallback: string, error: unknown): string {
  if (error && typeof error === "object" && !(error instanceof Error)) {
    const rzp = error as {
      statusCode?: number;
      error?: { code?: string; message?: string; description?: string };
      message?: string;
    };
    if (rzp.error) {
      const detail = rzp.error.description ?? rzp.error.message ?? "";
      const code = rzp.error.code ? ` (${rzp.error.code})` : "";
      const status = typeof rzp.statusCode === "number" ? ` [HTTP ${rzp.statusCode}]` : "";
      if (detail) return `${detail}${code}${status}`;
    }
    if (typeof rzp.message === "string" && rzp.message) return rzp.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export function razorpayErrorStatus(error: unknown): number {
  if (error && typeof error === "object") {
    const status = (error as { statusCode?: unknown }).statusCode;
    if (typeof status === "number" && status >= 400 && status < 600) return status;
  }
  return 500;
}