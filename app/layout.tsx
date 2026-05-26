import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://figuremymoney.com"),
  title: {
    default: "Figure My Money | Quantitative Options Trade Ideas",
    template: "%s | Figure My Money"
  },
  description:
    "Daily high-probability NASDAQ-100 options scans focused on probability, liquidity, risk management, and clean execution.",
  openGraph: {
    title: "Figure My Money",
    description:
      "A serious quantitative retail options platform for statistically repeatable NASDAQ-100 setups.",
    url: "https://figuremymoney.com",
    siteName: "Figure My Money",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0E14"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
