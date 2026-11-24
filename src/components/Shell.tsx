"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  Settings,
  Search,
  LogIn,
  LogOut,
  Menu,
  X,
  HelpCircle,
  CaseUpper,
  Highlighter,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "./Providers";
import SearchBox from "./SearchBox";

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  const { user, loading, openLogin, logout } = useSession();

  const [menu, setMenu] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const plain = path === "/" || path === "/choose-plan";

  // Font Size only appears on Read and Listen pages.
  const isReaderPage = path.startsWith("/player/");

  function changeFontSize(newSize: number) {
    const size = Math.max(14, Math.min(26, newSize));

    setFontSize(size);

    window.dispatchEvent(
      new CustomEvent("reader-font-size", {
        detail: size,
      }),
    );
  }

  if (plain) return <>{children}</>;

  const links = [
    { href: "/for-you", label: "For You", Icon: Home },
    { href: "/library", label: "My Library", Icon: Library },
    { href: "#", label: "Highlights", Icon: Highlighter },
    { href: "#", label: "Search", Icon: Search },
    { href: "#font-size", label: "Font Size", Icon: CaseUpper },
    { href: "/settings", label: "Settings", Icon: Settings },
    { href: "#", label: "Help & Support", Icon: HelpCircle },
  ];

  return (
    <div className="relative isolate min-h-screen md:flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setMenu(!menu)}
        className="fixed left-3 top-3 z-[60] rounded-lg bg-white p-2 shadow md:hidden"
        aria-expanded={menu}
        aria-controls="summarist-mobile-sidebar"
        aria-label="Toggle menu"
      >
        {menu ? <X /> : <Menu />}
      </button>

      {menu && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMenu(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        id="summarist-mobile-sidebar"
        className={`${
          menu ? "block" : "hidden"
        } fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r bg-white px-5 pb-6 pt-20 md:sticky md:top-0 md:block md:h-screen md:pt-8`}
      >
        {/* Logo */}
        <Link
          href="/for-you"
          className="mb-10 flex items-center gap-2"
          onClick={() => setMenu(false)}
        >
          <img
            className="h-10 w-auto object-contain"
            src="/assets/logo.png"
            alt="Summarist logo"
          />
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {links.map(({ href, label, Icon }) =>
            href === "#font-size" ? (
              <div
                key={label}
                className={isReaderPage ? "visible" : "invisible"}
              >
                <button
                  type="button"
                  onClick={() => setFontMenuOpen(!fontMenuOpen)}
                  disabled={!isReaderPage}
                  aria-expanded={fontMenuOpen && isReaderPage}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-gray-100"
                >
                  <Icon size={19} />
                  {label}
                </button>

                {fontMenuOpen && isReaderPage && (
                  <div className="mx-3 mt-2 flex items-center justify-between gap-1 rounded-xl bg-gray-100 p-2">
                    {[14, 18, 22, 26].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => changeFontSize(size)}
                        aria-label={`Set font size to ${size} pixels`}
                        aria-pressed={fontSize === size}
                        className={`flex h-12 flex-1 items-center justify-center rounded-lg transition ${
                          fontSize === size
                            ? "bg-white font-bold text-brand shadow-sm"
                            : "text-gray-600 hover:bg-white"
                        }`}
                        style={{
                          fontSize: `${size}px`,
                        }}
                      >
                        Aa
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : href === "#" ? (
              <div
                key={label}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-gray-400"
                title="Coming soon"
              >
                <Icon size={19} />
                {label}
              </div>
            ) : (
              <Link
                key={label}
                onClick={() => setMenu(false)}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  path === href
                    ? "bg-mint font-bold text-brand"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon size={19} />
                {label}
              </Link>
            ),
          )}
        </nav>

        {/* Anonymous visitors are guests, not registered accounts. */}
        <div className="mt-1">
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setMenu(false);
              if (user && !user.isAnonymous) {
                try {
                  await logout();
                } catch (error) {
                  console.error("Logout failed:", error);
                }
              } else {
                openLogin();
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-gray-100 disabled:opacity-50"
          >
            {user && !user.isAnonymous ? (
              <LogOut size={19} />
            ) : (
              <LogIn size={19} />
            )}
            {user && !user.isAnonymous ? "Logout" : "Login"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
        {/* Search header */}
        <div className="sticky top-0 z-20 border-b bg-white px-5 py-4 pl-16 md:px-8">
          <SearchBox />
        </div>

        {/* Page content */}
        <div className="container-page py-9">{children}</div>
      </main>
    </div>
  );
}
