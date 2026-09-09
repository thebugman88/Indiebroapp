// Bind work to a specific session, including logout then login to the same UID.
export function bindRequestSession<T>(
  current: () => T,
  revision: () => number,
) {
  const owner = current(),
    version = revision();
  const check = () => {
    if (current() !== owner || revision() !== version)
      throw new Error(
        "Account changed. Reopen this request in your current account.",
      );
  };
  return async <R>(operation: () => Promise<R>): Promise<R> => {
    check();
    const result = await operation();
    check();
    return result;
  };
}
