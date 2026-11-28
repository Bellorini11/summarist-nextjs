"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookById } from "@/lib/api";
import type { Book } from "@/types/book";
import { useSession } from "./Providers";
import { Play, Pause } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

function clock(n: number) {
  if (!Number.isFinite(n)) return "0:00";

  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
}

// Custom 10-second audio control icon.
function TenSecondIcon({ direction }: { direction: "back" | "forward" }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <g
        transform={
          direction === "forward" ? "translate(32 0) scale(-1 1)" : undefined
        }
      >
        <path
          d="M7 9 A12 12 0 1 1 4 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M7 2 V10 H15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="currentColor"
      >
        10
      </text>
    </svg>
  );
}

export default function AudioReader({ id }: { id: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audio = useRef<HTMLAudioElement>(null);

  const { user, premium, premiumLoading, openLogin, loading } = useSession();

  const router = useRouter();
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    function handleFontSize(event: Event) {
      const customEvent = event as CustomEvent<number>;
      setFontSize(customEvent.detail);
    }

    window.addEventListener("reader-font-size", handleFontSize);

    return () => {
      window.removeEventListener("reader-font-size", handleFontSize);
    };
  }, []);

  // Track how far the reader has scrolled.
  const [readingProgress, setReadingProgress] = useState(0);
  const readingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updateReadingProgress() {
      const article = readingRef.current;

      if (!article) return;

      const rect = article.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const totalDistance = rect.height + viewportHeight;
      const distanceScrolled = viewportHeight - rect.top;

      const progress = Math.max(
        0,
        Math.min(100, (distanceScrolled / totalDistance) * 100),
      );

      setReadingProgress(Math.round(progress));
    }

    window.addEventListener("scroll", updateReadingProgress, { passive: true });

    window.addEventListener("resize", updateReadingProgress);

    updateReadingProgress();

    return () => {
      window.removeEventListener("scroll", updateReadingProgress);

      window.removeEventListener("resize", updateReadingProgress);
    };
  }, [book, fontSize]);

  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") === "listen" ? "listen" : "read";

  useEffect(() => {
    const ac = new AbortController();

    bookById(id, ac.signal)
      .then(setBook)
      .catch(() => {
        if (!ac.signal.aborted) {
          setError("Could not load the book.");
        }
      });

    return () => ac.abort();
  }, [id]);

  // Allow authenticated guests to access free books.
  useEffect(() => {
    if (loading || premiumLoading || !book) return;

    if (!user) {
      router.replace(`/book/${encodeURIComponent(id)}`);
      openLogin();
    } else if (book.subscriptionRequired && (user.isAnonymous || !premium)) {
      router.replace("/choose-plan");
    }
  }, [book, user, premium, premiumLoading, loading, id, router, openLogin]);

  // Registered users and guests can finish books.
  async function markFinished() {
    if (!db || !user || !book) return;

    if (book.subscriptionRequired && (user.isAnonymous || !premium)) {
      return;
    }

    try {
      await setDoc(
        doc(db, "customers", user.uid, "library", id),
        {
          bookId: id,
          title: book.title,
          author: book.author,
          imageLink: book.imageLink || "",
          finished: true,
          finishedAt: Date.now(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Could not mark book as finished:", error);
    }
  }

  function toggle() {
    const el = audio.current;

    if (!el) return;

    if (el.paused) {
      el.play().catch(() => {
        setError("Audio could not play.");
      });
    } else {
      el.pause();
    }
  }

  // Move audio backward or forward by a specified number of seconds.
  function jump(seconds: number) {
    const el = audio.current;

    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) {
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(el.duration, el.currentTime + seconds),
    );

    el.currentTime = nextTime;
    setTime(nextTime);
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!book) {
    return <div className="skeleton h-96" />;
  }

  if (
    loading ||
    premiumLoading ||
    !user ||
    (book.subscriptionRequired && (user.isAnonymous || !premium))
  ) {
    return <div className="skeleton h-96" aria-label="Checking access" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-brand">
        {mode === "listen" ? "Now listening" : "Now reading"}
      </p>

      <h1 className="mt-2 text-3xl font-black">{book.title}</h1>

      <p className="mt-2 text-gray-500">{book.author}</p>

      <article
        ref={readingRef}
        className="panel mb-32 mt-8 whitespace-pre-line p-7 text-gray-800"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.8,
        }}
      >
        {book.summary || "Summary unavailable."}
      </article>

      {/* Fixed bottom book player */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-700 bg-ink px-5 py-3 text-white shadow-xl">
        <audio
          ref={audio}
          src={book.audioLink || undefined}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const seconds = e.currentTarget.duration;

            setDuration(Number.isFinite(seconds) ? seconds : 0);
          }}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            void markFinished();
          }}
        />

        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
          {/* LEFT: Book image, title and author */}
          <div className="flex min-w-0 items-center gap-3">
            {book.imageLink && (
              <img
                src={book.imageLink}
                alt={book.title}
                className="h-14 w-10 shrink-0 rounded object-cover"
              />
            )}

            <div className="min-w-0">
              <p className="whitespace-normal break-words text-sm font-semibold leading-snug">
                {book.title}
              </p>

              <p className="mt-1 text-xs text-gray-400">{book.author}</p>
            </div>
          </div>

          {/* CENTER: 10-second audio controls */}
          <div className="flex items-center justify-center gap-7">
            <button
              type="button"
              onClick={() => jump(-10)}
              aria-label="Rewind 10 seconds"
              title="Rewind 10 seconds"
              disabled={!book.audioLink || duration <= 0}
              className="transition hover:text-emerald-300 disabled:opacity-40"
            >
              <TenSecondIcon direction="back" />
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              disabled={!book.audioLink}
              className="rounded-full bg-white p-3 text-ink disabled:opacity-40"
            >
              {playing ? <Pause /> : <Play />}
            </button>

            <button
              type="button"
              onClick={() => jump(10)}
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds"
              disabled={!book.audioLink || duration <= 0}
              className="transition hover:text-emerald-300 disabled:opacity-40"
            >
              <TenSecondIcon direction="forward" />
            </button>
          </div>

          {/* RIGHT: Progress bar */}
          <div className="flex min-w-0 items-center gap-3 text-xs">
            {mode === "read" ? (
              <>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-600">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-[width] duration-150"
                    style={{
                      width: `${readingProgress}%`,
                    }}
                  />
                </div>

                <span className="w-10 text-right text-gray-300">
                  {readingProgress}%
                </span>
              </>
            ) : (
              <>
                <span>{clock(time)}</span>

                <input
                  aria-label="Seek audio"
                  className="min-w-0 flex-1 accent-emerald-300"
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="1"
                  value={Math.min(time, duration || 1)}
                  disabled={duration <= 0}
                  onChange={(e) => {
                    if (audio.current) {
                      const nextTime = Number(e.target.value);

                      audio.current.currentTime = nextTime;
                      setTime(nextTime);
                    }
                  }}
                />

                <span>{clock(duration)}</span>
              </>
            )}
          </div>
        </div>

        {!book.audioLink && (
          <p className="mt-2 text-center text-xs">
            No audio is available for this title.
          </p>
        )}
      </div>
    </div>
  );
}
