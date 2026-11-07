"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();
  return <nav className="nav" aria-label="Main navigation">
    <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Search</Link>
    <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined}>About</Link>
  </nav>;
}
