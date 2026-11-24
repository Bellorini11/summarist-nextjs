import type { Book } from "@/types/book";

const durationCache = new Map<string, number>();

export async function getAudioDuration(book: Book): Promise<number | null> {
  const audioLink = book.audioLink;
  if (!audioLink) return null;
  if (durationCache.has(book.id)) {
    return durationCache.get(book.id)!;
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    function finish(seconds: number | null) {
      if (settled) return;
      settled = true;

      audio.removeAttribute("src");
      audio.load();

      if (seconds !== null) {
        durationCache.set(book.id, seconds);
      }

      resolve(seconds);
    }

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const seconds = audio.duration;

      finish(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    };

    audio.onerror = () => finish(null);

    audio.src = audioLink;
    // Avoid waiting indefinitely for metadata.
    setTimeout(() => finish(null), 10000);
  });
}

export function formatAudioDuration(seconds: number): string {
  return `${Math.ceil(seconds / 60)} min`;
}
