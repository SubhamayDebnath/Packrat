export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiClientError("Can't reach the server. Check your connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth")) {
      window.location.replace("/login");
    }
    throw new ApiClientError(
      data.error ?? "Something went wrong. Try again.",
      res.status,
      data.fields,
    );
  }
  return data as T;
}
