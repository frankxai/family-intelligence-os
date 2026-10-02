import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  House,
  Network,
  GraduationCap,
  Workflow,
  Settings2,
  ShieldCheck,
  Feather,
  ArrowUpRight,
} from "lucide-react";
import "./globals.css";
import "./studio.css";
export const metadata: Metadata = {
  title: "Family Intelligence · A living legacy",
  description:
    "A private home for family stories, knowledge, principles and the next generation.",
  robots: { index: false, follow: false },
};
const navigation = [
  { href: "/dashboard", label: "Our home", icon: House },
  { href: "/capture", label: "Capture", icon: Feather },
  { href: "/library", label: "Legacy library", icon: BookOpen },
  { href: "/graph", label: "Knowledge graph", icon: Network },
  { href: "/learn", label: "Next generation", icon: GraduationCap },
  { href: "/workflows", label: "Agent workflows", icon: Workflow },
  { href: "/setup", label: "Set up & connect", icon: Settings2 },
];
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside className="studio-sidebar">
          <Link href="/" className="studio-brand">
            <span className="family-emblem">✦</span>
            <span>
              Family
              <br />
              <b>Intelligence</b>
            </span>
          </Link>
          <span className="sidebar-label">A LIVING LEGACY</span>
          <nav aria-label="Primary">
            {navigation.map((n) => (
              <Link href={n.href} key={n.href}>
                <n.icon size={18} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-seal">
              <ShieldCheck size={18} />
              <span>
                Family-owned knowledge
                <br />
                <small>Private by design</small>
              </span>
            </div>
            <Link href="/security">
              Access & protection <ArrowUpRight size={14} />
            </Link>
            <Link href="/de/portal">
              Familienportal <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
        <div className="studio-main">
          <header className="studio-topbar">
            <span>THE FAMILY WORKSPACE</span>
            <div>
              <span className="topbar-dot" /> Template mode{" "}
              <Link href="/setup" aria-label="Open setup">
                FI
              </Link>
            </div>
          </header>
          <main id="main-content">{children}</main>
          <footer className="studio-footer">
            <span>Preserve with care. Pass on with purpose.</span>
            <Link href="/setup">Portable by design ↗</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
