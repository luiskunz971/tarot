import type { Metadata } from "next";
import { Cormorant_Garamond, Marcellus_SC, Pinyon_Script } from "next/font/google";
import "./globals.css";

// Caligrafía para el nombre de la tarotista
const pinyon = Pinyon_Script({
  variable: "--font-script-face",
  subsets: ["latin"],
  weight: "400",
});

// Versalitas clásicas para botones y etiquetas
const marcellus = Marcellus_SC({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Madam Esteves · Tarot",
  description: "Una tarotista que te tira las cartas y te hace una lectura personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${pinyon.variable} ${marcellus.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
