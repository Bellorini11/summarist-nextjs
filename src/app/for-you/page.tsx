import BookSection from "@/components/BookSection";

export default function ForYou() {
  return (
    <>
      <BookSection status="selected" title="Selected just for you" />

      <BookSection status="recommended" title="Recommended For You" />

      <BookSection status="suggested" title="Suggested Books" />
    </>
  );
}
