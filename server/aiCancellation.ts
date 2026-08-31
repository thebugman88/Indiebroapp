export class CancellationUnconfirmed extends Error {}
export class ProviderDeadline extends Error {}

// A timed-out attempt must settle after cancellation before another may start.
// If a transport ignores abort, stop the chain instead of multiplying requests.
export async function cancellableAttempt<T>(
  invoke: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parent?: AbortSignal,
  cancellationGraceMs = 1000,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let grace: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  const cancel = () =>
    controller.abort(parent?.reason || new Error("Request canceled."));
  if (parent?.aborted) throw new Error("Request canceled.");
  parent?.addEventListener("abort", cancel, { once: true });
  let settled = false;
  const work = Promise.resolve().then(() => invoke(controller.signal));
  const completion = work.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("Provider timeout."));
      reject(new Error("Provider timeout."));
    }, timeoutMs);
  });
  try {
    return await Promise.race([work, deadline]);
  } catch (error) {
    controller.abort();
    if (!settled)
      await Promise.race([
        completion,
        new Promise<void>((resolve) => {
          grace = setTimeout(resolve, cancellationGraceMs);
        }),
      ]);
    if (!settled)
      throw new CancellationUnconfirmed(
        "Provider cancellation could not be confirmed; no fallback was started.",
      );
    // A closed transport does not prove the provider stopped remote work.
    if (timedOut)
      throw new ProviderDeadline("Provider timeout; no fallback was started.");
    throw error;
  } finally {
    clearTimeout(timer);
    clearTimeout(grace);
    parent?.removeEventListener("abort", cancel);
  }
}
