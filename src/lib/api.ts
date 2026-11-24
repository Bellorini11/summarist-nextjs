import type { Book } from "@/types/book";
const BASE = "https://us-central1-summaristt.cloudfunctions.net";
async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal, cache: "no-store" });
  if (!r.ok) throw new Error(`Book API error (${r.status})`);
  return r.json() as Promise<T>;
}
export const booksByStatus = (
  status: "selected" | "recommended" | "suggested",
  signal?: AbortSignal,
) => get<Book | Book[]>(`${BASE}/getBooks?status=${status}`, signal);
export const bookById = (id: string, signal?: AbortSignal) =>
  get<Book>(`${BASE}/getBook?id=${encodeURIComponent(id)}`, signal);
export const searchBooks = (q: string, signal?: AbortSignal) =>
  get<Book[]>(
    `${BASE}/getBooksByAuthorOrTitle?search=${encodeURIComponent(q)}`,
    signal,
  );
