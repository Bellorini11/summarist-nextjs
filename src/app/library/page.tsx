"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { bookById } from "@/lib/api";
import { useSession } from "@/components/Providers";
import BookCard from "@/components/BookCard";
import type { Book } from "@/types/book";

type Saved = {
  bookId: string;
  finished: boolean;
};

type LibraryBook = {
  book: Book;
  finished: boolean;
};

export default function Library() {
  const { user, loading, openLogin } = useSession();

  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user || user.isAnonymous || !db) {
      setBooks([]);
      setBusy(false);
      setError("");
      return;
    }

    const firestore = db;
    let cancelled = false;
    let activeController: AbortController | null = null;

    setBusy(true);
    setError("");

    const unsubscribe = onSnapshot(
      collection(firestore, "customers", user.uid, "library"),

      async (snapshot) => {
        activeController?.abort();

        const controller = new AbortController();
        activeController = controller;

        setBusy(true);
        setError("");

        const savedBooks: Saved[] = snapshot.docs.map((doc) => {
          const data = doc.data() as {
            bookId?: string;
            finished?: boolean;
          };

          return {
            bookId: data.bookId || doc.id,
            finished: Boolean(data.finished),
          };
        });

        const results = await Promise.allSettled(
          savedBooks.map(async (saved) => {
            const book = await bookById(saved.bookId, controller.signal);

            return {
              book,
              finished: saved.finished,
            };
          }),
        );

        if (cancelled || controller.signal.aborted) return;

        const loadedBooks: LibraryBook[] = [];
        let failed = false;

        for (const result of results) {
          if (result.status === "fulfilled") {
            loadedBooks.push(result.value);
          } else {
            failed = true;
          }
        }

        setBooks(loadedBooks);
        setBusy(false);

        if (failed) {
          setError("Some books could not be loaded.");
        }
      },

      () => {
        if (cancelled) return;

        activeController?.abort();
        setError("Unable to load library. Check Firestore permissions.");
        setBusy(false);
      },
    );

    return () => {
      cancelled = true;
      activeController?.abort();
      unsubscribe();
    };
  }, [user?.uid, user?.isAnonymous, loading]);

  if (loading || busy) {
    return <div className="skeleton h-56" />;
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-3xl font-bold">Your library</h1>

        <p className="my-4">Sign in to save and finish books.</p>

        <button onClick={openLogin} className="primary">
          Log in
        </button>
      </div>
    );
  }

  const savedBooks = books
    .filter((item) => !item.finished)
    .map((item) => item.book);

  const finishedBooks = books
    .filter((item) => item.finished)
    .map((item) => item.book);

  const sections = [
    { title: "Saved books", items: savedBooks },
    { title: "Finished books", items: finishedBooks },
  ];

  return (
    <div className="pb-12">
      <h1 className="mb-8 text-4xl font-black">My Library</h1>

      {error && (
        <p role="alert" className="mb-5 text-red-700">
          {error}
        </p>
      )}

      {sections.map((section) => (
        <section key={section.title} className="mb-12">
          <h2 className="mb-5 text-2xl font-bold">{section.title}</h2>

          {section.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {section.items.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No books here yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}
