import "./home-reference.css";
import './globals.css';import type {Metadata} from 'next';import Providers from '@/components/Providers';import Shell from '@/components/Shell';
export const metadata:Metadata={title:'Summarist | Book summaries',description:'An original book-summary learning experience'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers><Shell>{children}</Shell></Providers></body></html>}
