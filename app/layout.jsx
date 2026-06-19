import "./globals.css";

export const metadata = {
  title: "Pre-K Activity Planner",
  description: "Standards-aligned Pre-K activities, with every citation verified.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
