const { spawn } = require('child_process');

const child = spawn('npx.cmd', ['drizzle-kit', 'generate'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  // Auto-answer any prompts with empty string (which defaults to 'new column' instead of 'rename')
  // Or 'yes' for everything
  if (output.includes('?')) {
    child.stdin.write('\n'); // Default answer
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  process.exit(code);
});
