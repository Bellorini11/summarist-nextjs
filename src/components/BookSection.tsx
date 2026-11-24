"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Play } from "lucide-react";

import { booksByStatus, bookById } from "@/lib/api";
import type { Book } from "@/types/book";
import { bookDuration } from "@/types/book";

import { getAudioDuration } from "@/lib/audioDuration";

import BookCard from "./BookCard";

type BookStatus = "selected" | "recommended" | "suggested";

// Skeleton for regular book cards
function BookCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-3">
      {/* Book cover */}
      <div className="aspect-[3/4] w-full rounded-xl bg-gray-200" />

      {/* Book title */}
      <div className="h-4 w-11/12 rounded bg-gray-200" />
      <div className="h-4 w-7/12 rounded bg-gray-200" />

      {/* Author */}
      <div className="h-3 w-2/3 rounded bg-gray-200" />

      {/* Duration and rating */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-3 w-12 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// Skeleton matching the Selected Book layout
function SelectedBookSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid animate-pulse gap-6 rounded-2xl border bg-white p-6 md:grid-cols-3"
    >
      {/* Left: Description */}
      <div className="space-y-3 pt-4">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-11/12 rounded bg-gray-200" />
        <div className="h-4 w-8/12 rounded bg-gray-200" />
      </div>

      {/* Middle: Book cover */}
      <div className="flex h-56 items-center justify-center rounded-xl bg-gray-100 p-4">
        <div className="h-full w-32 rounded-lg bg-gray-200" />
      </div>

      {/* Right: Book details */}
      <div className="space-y-4">
        <div className="h-6 w-4/5 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />

        <div className="flex items-center gap-4 pt-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-11 w-11 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function SelectedBookCard({ book }: { book: Book }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSeconds(null);

    getAudioDuration(book).then((duration) => {
      if (!cancelled) {
        setSeconds(duration);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [book.id, book.audioLink]);

  const durationText =
    seconds !== null
      ? `${Math.floor(seconds / 60)} mins ${Math.floor(seconds % 60)} secs`
      : bookDuration(book);

  return (
    <Link
      href={`/book/${encodeURIComponent(book.id)}`}
      className="group grid gap-6 rounded-2xl border bg-white p-6 transition hover:shadow-lg md:grid-cols-3"
    >
      {/* LEFT: Description */}
      <div className="flex h-full flex-col justify-start pt-4">
        <p className="text-base font-medium leading-7 text-gray-700">
          {book.subTitle || "Discover the key ideas from this book."}
        </p>
      </div>

      {/* MIDDLE: Cover */}
      <div className="flex h-56 items-center justify-center rounded-xl bg-emerald-50 p-4">
        {book.imageLink ? (
          <img
            src={book.imageLink}
            alt={`Cover of ${book.title}`}
            className="h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-5xl">📚</span>
        )}
      </div>

      {/* RIGHT: Book details */}
      <div>
        <h3 className="text-xl font-bold group-hover:text-brand">
          {book.title}
          {book.subscriptionRequired && (
            <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-1 align-middle text-xs font-bold text-emerald-800">
              Premium
            </span>
          )}
        </h3>

        <p className="mt-2 text-sm text-gray-500">{book.author}</p>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Clock size={16} />
            {durationText}
          </span>

          <span
            aria-label="View book and listen"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white transition group-hover:bg-emerald-700"
          >
            <Play size={20} fill="currentColor" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BookSection({
  status,
  title,
}: {
  status: BookStatus;
  title: string;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    async function loadBooks() {
      setLoading(true);
      setError("");
      setBooks([]);

      try {
        const data = await booksByStatus(status, ac.signal);

        const initialBooks = Array.isArray(data) ? data : [data];

        let completeBooks = initialBooks;

        // Fetch complete information only for Selected books.
        if (status === "selected") {
          completeBooks = await Promise.all(
            initialBooks.map(async (book) => {
              if (!book.id) return book;

              try {
                const fullBook = await bookById(book.id, ac.signal);

                return { ...book, ...fullBook };
              } catch {
                return book;
              }
            }),
          );
        }

        if (!ac.signal.aborted) {
          setBooks(completeBooks);
        }
      } catch {
        if (!ac.signal.aborted) {
          setError(
            "Could not load books. Check your connection or API availability.",
          );
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => ac.abort();
  }, [status]);

  const subtitle =
    status === "recommended"
      ? "We think you'll like these"
      : status === "suggested"
        ? "Browse those books"
        : "";

  return (
    <section className="mb-11" aria-busy={loading}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold">{title}</h2>

        {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
      </div>

      {loading ? (
        status === "selected" ? (
          <div role="status" aria-label="Loading selected book">
            <SelectedBookSkeleton />
            <span className="sr-only">Loading selected book...</span>
          </div>
        ) : (
          <div role="status" aria-label={`Loading ${title}`}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <BookCardSkeleton key={index} />
              ))}
            </div>

            <span className="sr-only">Loading books...</span>
          </div>
        )
      ) : error ? (
        <div role="alert" className="panel p-5 text-red-700">
          {error}
        </div>
      ) : status === "selected" ? (
        <div className="space-y-4">
          {books.map((book) => (
            <SelectedBookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
