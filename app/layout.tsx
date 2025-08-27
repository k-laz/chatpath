import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConversationProvider } from '@/store/ConversationContext';
import { SelectionProvider } from '@/store/SelectionContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatPath - Conversational Tree Interface",
  description: "Branch off from any point in a conversation to explore tangential questions while preserving context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConversationProvider>
          <SelectionProvider>
            {children}
          </SelectionProvider>
        </ConversationProvider>
      </body>
    </html>
  );
}
