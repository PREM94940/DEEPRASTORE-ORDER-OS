const fs = require('fs');
const path = require('path');
const appDir = 'apps/web/app';
const staffDir = path.join(appDir, '(staff)');
if (!fs.existsSync(staffDir)) fs.mkdirSync(staffDir);

const dirsToMove = ['pilot', 'payments', '(admin)', 'test-customer-360', 'command-center', 'page.tsx'];
dirsToMove.forEach(dir => {
  const src = path.join(appDir, dir);
  const dest = path.join(staffDir, dir);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log('Moved', src, 'to', dest);
  }
});

// Move layout.tsx to staff layout
const rootLayoutSrc = path.join(appDir, 'layout.tsx');
const staffLayoutDest = path.join(staffDir, 'layout.tsx');
if (fs.existsSync(rootLayoutSrc)) {
  fs.renameSync(rootLayoutSrc, staffLayoutDest);
  console.log('Moved root layout to staff layout');
}

// Create new bare layout.tsx
const newRootLayout = `import "./globals.css";
export const metadata = { title: "Deeprastore OS", description: "Operating System for Deeprastore" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-50 font-sans">
        {children}
      </body>
    </html>
  );
}
`;
fs.writeFileSync(rootLayoutSrc, newRootLayout);
console.log('Created new root layout');
