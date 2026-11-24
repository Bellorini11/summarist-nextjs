"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { bookById } from "@/lib/api";
import { bookDuration } from "@/types/book";
import type { Book } from "@/types/book";

import { getAudioDuration, formatAudioDuration } from "@/lib/audioDuration";

import { useSession } from "./Providers";

import {
  Clock,
  Mic,
  BookOpen,
  Bookmark,
  Star,
  Lightbulb,
  Headphones,
} from "lucide-react";

import { db } from "@/lib/firebase";

import {
  doc,
  getDocFromCache,
  getDocFromServer,
  setDoc,
} from "firebase/firestore";

export default function BookDetail({ id }: { id: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [actualDuration, setActualDuration] = useState<number | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const pendingSave = useRef(false);

  const { user, premium, premiumLoading, openLogin } = useSession();
  const router = useRouter();

  // Load book details
  useEffect(() => {
    const ac = new AbortController();

    setLoading(true);
    setError("");
    setMessage("");
    setBook(null);
    setActualDuration(null);

    bookById(id, ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) {
          setBook(data);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setError("Unable to load this book.");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      });

    return () => ac.abort();
  }, [id]);

  // Retrieve actual audio duration
  useEffect(() => {
    if (!book) {
      setActualDuration(null);
      return;
    }

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
  }, [book]);

  // Check saved status without blocking the button
  useEffect(() => {
    let cancelled = false;

    pendingSave.current = false;
    setIsSaved(false);
    setSaving(false);

    if (!user || user.isAnonymous || !db) return;

    const bookRef = doc(db, "customers", user.uid, "library", id);

    async function checkLibrary() {
      try {
        let snapshot;

        try {
          snapshot = await getDocFromCache(bookRef);
        } catch {
          snapshot = await getDocFromServer(bookRef);
        }

        if (!cancelled && !pendingSave.current) {
          setIsSaved(snapshot.exists());
        }
      } catch {
        // Keep verification errors silent.
        // Do not block the save button.
      }
    }

    checkLibrary();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, id]);

  // Open Read or Listen
  function enter(mode: "read" | "listen") {
    if (!user || user.isAnonymous) {
      openLogin();
      return;
    }

    if (premiumLoading) return;

    if (book?.subscriptionRequired && !premium) {
      router.push("/choose-plan");
      return;
    }

    router.push(`/player/${encodeURIComponent(id)}?mode=${mode}`);
  }

  // Save to My Library with immediate visual feedback
  async function save() {
    if (!user || user.isAnonymous) {
      openLogin();
      return;
    }

    if (isSaved || saving || pendingSave.current) {
      return;
    }

    if (!db || !book) {
      setMessage("Connect Firestore to save your library.");
      return;
    }

    const currentId = id;
    const currentUserId = user.uid;

    pendingSave.current = true;

    setIsSaved(true);
    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "customers", currentUserId, "library", currentId),
        {
          bookId: currentId,
          title: book.title,
          author: book.author,
          imageLink: book.imageLink || "",
          finished: false,
          savedAt: Date.now(),
        },
        { merge: true },
      );
    } catch {
      setIsSaved(false);
      setMessage("Could not save. Check Firestore permissions.");
    } finally {
      pendingSave.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="skeleton h-96" />;
  }

  if (error || !book) {
    return <p role="alert">{error || "Book not found"}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* TOP: Book information and cover */}
      <div className="grid gap-8 md:grid-cols-[1fr_240px]">
        {/* LEFT: Book information */}
        <div>
          {/* BOOK TITLE */}
          <h1 className="text-3xl font-black md:text-4xl">
            {book.title}
            {book.subscriptionRequired && (
              <span className="ml-2 inline-block align-middle text-base font-semibold text-emerald-700">
                (Premium)
              </span>
            )}
          </h1>

          {/* AUTHOR - BOLDER */}
          <p className="mt-3 text-lg font-semibold text-gray-800">
            {book.author}
          </p>

          {/* SUBTITLE - LIGHTER */}
          {book.subTitle && (
            <p className="mt-2 text-base font-normal text-gray-600">
              {book.subTitle}
            </p>
          )}

          {/* BOOK STATISTICS - BOLDER */}
          <div className="mt-6 grid max-w-md grid-cols-2 gap-4 text-sm font-semibold text-gray-800">
            {/* DURATION */}
            <span className="flex items-center gap-2">
              <Clock size={17} />

              {actualDuration !== null
                ? formatAudioDuration(actualDuration)
                : bookDuration(book)}
            </span>

            {/* RATING */}
            <span className="flex items-center gap-2">
              <Star size={17} />
              {book.averageRating ?? "—"} rating
            </span>

            {/* AUDIO & TEXT WITH MICROPHONE */}
            <span className="flex items-center gap-2">
              <Mic size={17} />
              Audio &amp; Text
            </span>

            {/* KEY IDEAS */}
            <span className="flex items-center gap-2">
              <Lightbulb size={17} />
              {book.keyIdeas ?? "—"} key ideas
            </span>
          </div>

          {/* READ AND LISTEN BUTTONS */}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => enter("read")}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              <BookOpen size={18} />
              Read
            </button>

            <button
              type="button"
              onClick={() => enter("listen")}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              <Headphones size={18} />
              Listen
            </button>
          </div>

          {/* MY LIBRARY - LARGER TEXT AND ICON */}
          <button
            type="button"
            onClick={save}
            disabled={isSaved || saving}
            aria-pressed={isSaved}
            className={`mt-5 flex items-center gap-3 text-base font-semibold transition ${
              isSaved
                ? "cursor-default text-emerald-700"
                : "text-brand hover:underline"
            }`}
          >
            <Bookmark
              size={21}
              strokeWidth={2.2}
              fill={isSaved ? "currentColor" : "none"}
            />

            {isSaved ? "Saved in My Library" : "Add title to My Library"}
          </button>

          {message && (
            <p role="status" className="mt-3 text-sm text-red-600">
              {message}
            </p>
          )}
        </div>

        {/* RIGHT: BOOK COVER */}
        <div className="flex items-center justify-center rounded-2xl bg-emerald-50 p-5">
          {book.imageLink ? (
            <img
              src={book.imageLink}
              alt={`Cover of ${book.title}`}
              className="max-h-72 max-w-full object-contain"
            />
          ) : (
            <span className="text-6xl">📚</span>
          )}
        </div>
      </div>

      {/* WHAT'S IT ABOUT? */}

      {/* WHAT'S IT ABOUT? */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">What's it about?</h2>

        {/* BOOK TAGS - DIRECTLY UNDER THE HEADING */}
        {book.tags && book.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {book.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* BOOK DESCRIPTION */}
        <p className="mt-4 whitespace-pre-line leading-7 text-gray-700">
          {book.bookDescription || book.summary || "Description not available."}
        </p>
      </section>

      {/* ABOUT THE AUTHOR */}
      {book.authorDescription && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">About the author</h2>

          <p className="mt-4 whitespace-pre-line leading-7 text-gray-700">
            {book.authorDescription}
          </p>
        </section>
      )}
    </div>
  );
}
