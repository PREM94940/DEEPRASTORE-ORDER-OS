import "../globals.css";

export const metadata = { title: "Deeprastore", description: "Deeprastore Customer Portal" };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white font-sans">
        {children}
      </body>
    </html>
  );
}
