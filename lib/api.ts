export async function apiFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  let data: T | null = null;

  try {
    data = (await response.json()) as T;
  } catch {}

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Request failed";
    throw new Error(errorMessage);
  }

  return data as T;
}
