import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import { getUsers } from "@/lib/data";
import { TopBar } from "@/components/top-bar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-loaded",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-loaded",
});

export const metadata: Metadata = {
  title: "Whiteboard · RT Case Tracker",
  description: "Radiation therapy case tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5efe3",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const users = await getUsers();
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <UserProvider users={users}>
          <div className="flex min-h-dvh flex-col">
            <TopBar />
            <main className="flex-1 mx-auto w-full max-w-3xl">{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
