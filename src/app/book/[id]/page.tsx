import BookDetail from '@/components/BookDetail';export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <BookDetail id={id}/>}
