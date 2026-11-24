"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchBooks } from "@/lib/api";
import type { Book } from "@/types/book";

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q.trim()) {
      setBooks([]);
      setError("");
      setLoading(false);
      return;
    }

    const ac = new AbortController();

    const timer = setTimeout(() => {
      setLoading(true);

      searchBooks(q, ac.signal)
        .then((data) => {
          if (!ac.signal.aborted) {
            setBooks(Array.isArray(data) ? data : []);
            setError("");
          }
        })
        .catch(() => {
          if (!ac.signal.aborted) {
            setError("Search unavailable");
          }
        })
        .finally(() => {
          if (!ac.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [q]);

  return (
    <div className="relative w-full max-w-xs">
      {/* Search bar */}
      <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3">
        <input
          aria-label="Search for books"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for books"
          className="w-full min-w-0 bg-transparent py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        <Search size={18} className="ml-2 shrink-0 text-gray-500" />
      </div>

      {/* Search results */}
      {q.trim() && (
        <div className="absolute right-0 top-full z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border bg-white p-2 shadow-xl">
          {loading ? (
            <p className="p-3 text-sm">Searching…</p>
          ) : error ? (
            <p className="p-3 text-sm text-red-700">{error}</p>
          ) : books.length ? (
            books.map((book) => (
              <Link
                key={book.id}
                href={`/book/${encodeURIComponent(book.id)}`}
                onClick={() => setQ("")}
                className="block rounded-lg p-3 hover:bg-mint"
              >
                <strong>{book.title}</strong>
                <span className="block text-sm text-gray-500">
                  {book.author}
                </span>
              </Link>
            ))
          ) : (
            <p className="p-3 text-sm">No matching books</p>
          )}
        </div>
      )}
    </div>
  );
}
