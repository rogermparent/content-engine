import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Engine Demo",
  description: "Demo application for content-engine package",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <header style={{ marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
          <h1 style={{ margin: 0 }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>Content Engine Demo</a>
          </h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
