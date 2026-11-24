import AudioReader from "@/components/AudioReader";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AudioReader id={id} />;
}
