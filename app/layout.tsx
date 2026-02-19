import "./globals.css";

export const metadata = {
  title: "Smart Bookmark App",
  description: "A simple real-time bookmark manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 font-sans">{children}</body>
    </html>
  );
}
