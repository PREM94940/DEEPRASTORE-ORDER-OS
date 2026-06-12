const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const dbUrl = envFile.match(/DATABASE_URL="([^"]+)"/)[1];

console.log(`Adding DATABASE_URL to Vercel admin-portal...`);
try {
  execSync(`npx vercel env add DATABASE_URL production`, {
    cwd: './apps/admin-portal',
    input: dbUrl,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log("Added to production");
  
  execSync(`npx vercel env add DATABASE_URL preview`, {
    cwd: './apps/admin-portal',
    input: dbUrl,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log("Added to preview");
} catch (e) {
  console.error(e);
}
