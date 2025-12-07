import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Mathematics Robo Tutor",
  description: "Generate fun, Gemini-powered Grade 2 math questions for targeted practice."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
