import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Family Intelligence OS",
  description: "Private AI-powered family operating system."
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connectors", label: "Connectors" },
  { href: "/audit", label: "Audit" },
  { href: "/security", label: "Security" },
  { href: "/library", label: "Library" },
  { href: "/de/portal", label: "Familienportal" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="shell header">
          <Link href="/" className="brand" aria-label="Family Intelligence OS home">
            <span className="brand-mark" />
            <span>Family Intelligence OS</span>
          </Link>
          <nav aria-label="Primary">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
