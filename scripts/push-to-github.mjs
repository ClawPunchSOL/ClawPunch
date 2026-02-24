import fs from 'fs';

const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error('Usage: node scripts/push-to-github.mjs <GITHUB_TOKEN>'); process.exit(1); }

const REPO = 'ClawPunchSOL/ClawPunch';
const API = `https://api.github.com/repos/${REPO}/contents`;
const headers = {
  'Authorization': `token ${TOKEN.trim()}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'ClawPunch-Bot',
  'Content-Type': 'application/json'
};

async function getFileSha(path) {
  const r = await fetch(`${API}/${path}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ClawPunch-Bot' }
  });
  if (!r.ok) return null;
  return (await r.json()).sha;
}

async function updateFile(path, content, message) {
  const sha = await getFileSha(path);
  if (!sha) { console.log(`SKIP: ${path} - not on GitHub`); return; }
  const r = await fetch(`${API}/${path}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha })
  });
  const d = await r.json();
  console.log(r.ok ? `OK: ${path}` : `FAIL: ${path} - ${d.message}`);
}

async function main() {
  const r = await fetch('https://api.github.com/user', { headers });
  const u = await r.json();
  if (!u.login) { console.error('Auth failed:', u.message); process.exit(1); }
  console.log('Authenticated as:', u.login);

  const files = [
    'README.md', 'docs/AGENTS.md', 'docs/API_REFERENCE.md',
    'docs/ARCHITECTURE.md', 'docs/PROTOCOL.md', 'gitbook/DOCUMENTATION.md',
    '.gitignore', 'CHANGELOG.md', 'CONTRIBUTING.md', '.env.example'
  ];

  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      await updateFile(f, content, `Remove third-party branding from ${f}`);
    } catch (e) {
      console.log(`SKIP: ${f} - ${e.message?.split('\n')[0]}`);
    }
  }
  console.log('\nDone. Check https://github.com/ClawPunchSOL/ClawPunch');
}

main();
