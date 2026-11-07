import type { Metadata } from "next";
import { FlaskConical, Layers3 } from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CIVITA - Concrete Database Search", template: "%s | CIVITA" },
  description: "A research interface for discovering concrete and cementitious-material experiments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="CIVITA home">
          <span className="brand-mark"><Layers3 size={20} strokeWidth={2.1} /></span>
          <span>CIVITA</span><span className="brand-divider" /><span className="brand-subtitle">Concrete Database</span>
        </Link>
        <Navigation />
        <span className="prototype-tag"><FlaskConical size={13} /> Research prototype</span>
      </div>
    </header>
    {children}
    <footer className="site-footer"><div><b>CIVITA</b><span>Grand Challenge Concrete Database</span></div><span>Demonstration with synthetic data</span></footer>
  </body></html>;
}
