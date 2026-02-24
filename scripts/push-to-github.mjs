const TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'ClawPunchSOL/ClawPunch';
const API = `https://api.github.com/repos/${REPO}/contents`;

const headers = {
  'Authorization': `token ${TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'ClawPunch-Bot',
  'Content-Type': 'application/json'
};

async function getFileSha(path) {
  const r = await fetch(`${API}/${path}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ClawPunch-Bot' }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.sha;
}

async function updateFile(path, content, message) {
  const sha = await getFileSha(path);
  if (!sha) {
    console.log(`SKIP: ${path} not found on GitHub`);
    return;
  }
  const encoded = Buffer.from(content).toString('base64');
  const r = await fetch(`${API}/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: encoded, sha })
  });
  const d = await r.json();
  if (r.ok) {
    console.log(`OK: ${path}`);
  } else {
    console.log(`FAIL: ${path} - ${d.message}`);
  }
}

async function readLocal(path) {
  const fs = await import('fs');
  return fs.readFileSync(path, 'utf8');
}

async function main() {
  const r = await fetch('https://api.github.com/user', { headers });
  const u = await r.json();
  if (!u.login) {
    console.error('Auth failed:', u.message);
    process.exit(1);
  }
  console.log('Authenticated as:', u.login);

  const files = [
    { github: 'README.md', local: 'README.md' },
    { github: 'docs/AGENTS.md', local: 'docs/AGENTS.md' },
    { github: 'docs/API_REFERENCE.md', local: 'docs/API_REFERENCE.md' },
    { github: 'docs/ARCHITECTURE.md', local: 'docs/ARCHITECTURE.md' },
    { github: 'docs/PROTOCOL.md', local: 'docs/PROTOCOL.md' },
    { github: 'gitbook/DOCUMENTATION.md', local: 'gitbook/DOCUMENTATION.md' },
    { github: '.gitignore', local: '.gitignore' },
  ];

  for (const f of files) {
    try {
      const content = await readLocal(f.local);
      await updateFile(f.github, content, `Clean proprietary branding: ${f.github}`);
    } catch (e) {
      console.log(`ERROR: ${f.local} - ${e.message}`);
    }
  }

  const extraFiles = ['CHANGELOG.md', 'CONTRIBUTING.md', '.env.example'];
  for (const f of extraFiles) {
    try {
      const content = await readLocal(f);
      await updateFile(f, content, `Clean proprietary branding: ${f}`);
    } catch (e) {
      console.log(`SKIP: ${f} - not found locally`);
    }
  }
}

main();
