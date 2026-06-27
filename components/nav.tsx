"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens } from "@/lib/api";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/bags", label: "Bags" },
  { href: "/profile", label: "Profile" },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    clearTokens();
    router.push("/login");
    onClick?.();
  }

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`block px-3.5 py-2.5 rounded-lg text-[15px] no-underline transition-[background,color] duration-[180ms] ${
              active
                ? "nav-link-active"
                : "font-normal text-[color:var(--fg-secondary)] hover:bg-[var(--bg-surface)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleSignOut}
        className="block w-full text-left px-3.5 py-2.5 rounded-lg text-[15px] font-normal text-destructive bg-transparent border-none cursor-pointer transition-[background] duration-[180ms] hover:bg-[rgba(232,48,74,0.07)]"
      >
        Sign out
      </button>
    </>
  );
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 h-14 bg-card border-b border-border flex items-center justify-end px-4 shadow-[var(--shadow-xs-val)]">
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <DesktopNavLink key={href} href={href} label={label} />
          ))}
          <SignOutBtn />
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex sm:hidden flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 text-foreground"
          aria-label="Menu"
        >
          <span
            className="burger-bar"
            style={{
              transform: menuOpen
                ? "rotate(45deg) translate(5px, 5px)"
                : "none",
            }}
          />
          <span className="burger-bar" style={{ opacity: menuOpen ? 0 : 1 }} />
          <span
            className="burger-bar"
            style={{
              transform: menuOpen
                ? "rotate(-45deg) translate(5px, -5px)"
                : "none",
            }}
          />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[41] bg-[rgba(28,35,51,0.4)] backdrop-blur-sm border-none p-0 cursor-default"
          />
          <div className="fixed top-0 right-0 w-4/5 bottom-0 z-[42] bg-card pt-[68px] px-3 pb-4 flex flex-col gap-0.5 shadow-[var(--shadow-md-val)]">
            <NavLinks onClick={() => setMenuOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm no-underline transition-[background,color] duration-[180ms] ${
        active
          ? "nav-link-active"
          : "font-normal text-[color:var(--fg-secondary)] hover:bg-[var(--bg-surface)]"
      }`}
    >
      {label}
    </Link>
  );
}

function SignOutBtn() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        clearTokens();
        router.push("/login");
      }}
      className="px-3 py-1.5 rounded-lg text-sm font-normal text-destructive bg-transparent border-none cursor-pointer ml-1 hover:bg-[rgba(232,48,74,0.07)] transition-[background] duration-[180ms]"
    >
      Sign out
    </button>
  );
}
