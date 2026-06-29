import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Платформа каталогов",
  description: "SaaS-платформа каталогов с подпиской",
  icons: {
    apple: "/apple-icon.png",
    icon: "/icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
