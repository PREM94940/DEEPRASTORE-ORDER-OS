import "../globals.css";

export const metadata = { title: "Deeprastore Auth", description: "Secure Staff Authentication" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white font-sans">
        {children}
      </body>
    </html>
  );
}
