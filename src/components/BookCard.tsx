"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Book } from "@/types/book";
import { bookDuration } from "@/types/book";

import { getAudioDuration, formatAudioDuration } from "@/lib/audioDuration";

import { Clock, Star } from "lucide-react";

export default function BookCard({ book }: { book: Book }) {
  // Store the actual audio duration in seconds
  const [actualDuration, setActualDuration] = useState<number | null>(null);

  // Retrieve the actual duration from the audio file
  useEffect(() => {
    let cancelled = false;

    setActualDuration(null);

    getAudioDuration(book).then((seconds) => {
      if (!cancelled) {
        setActualDuration(seconds);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [book.id, book.audioLink]);

  return (
    <Link
      href={`/book/${encodeURIComponent(book.id)}`}
      className="group relative block min-w-0 rounded-2xl border bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg"
    >
      {book.subscriptionRequired && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
          Premium
        </span>
      )}
      {/* BOOK COVER */}
      <div className="flex h-44 items-center justify-center rounded-xl bg-emerald-50 p-2">
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

      {/* BOOK TITLE */}
      <h3 className="mt-3 line-clamp-2 font-bold group-hover:text-brand">
        {book.title}
      </h3>

      {/* AUTHOR */}
      <p className="mt-1 truncate text-sm text-gray-500">{book.author}</p>

      {/* SUBTITLE */}
      {book.subTitle && (
        <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800">
          {book.subTitle}
        </p>
      )}

      {/* DURATION AND RATING */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        {/* ACTUAL AUDIO DURATION */}
        <span className="flex items-center gap-1">
          <Clock size={13} />

          {actualDuration !== null
            ? formatAudioDuration(actualDuration)
            : bookDuration(book)}
        </span>

        {/* BOOK RATING */}
        {book.averageRating != null && (
          <span className="flex items-center gap-1">
            <Star size={13} />
            {book.averageRating}
          </span>
        )}
      </div>
    </Link>
  );
}
