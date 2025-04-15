import type { Metadata } from "next";
import { Figtree} from "next/font/google";
import "./globals.css";

const figTree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "The Dramatic Conditions in Italian Prisons",
  description: "Design by Valeria Beccari, d3 by Bryony Miles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${figTree.variable} ${figTree.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
