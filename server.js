const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store
let ideas = [];
let nextId = 1;

// GET all ideas, sorted by votes desc then newest first
app.get('/api/ideas', (req, res) => {
  const sorted = [...ideas].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return b.id - a.id;
  });
  res.json(sorted);
});

// POST a new idea
app.post('/api/ideas', (req, res) => {
  const { text, author } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Idea text is required' });
  }
  const idea = {
    id: nextId++,
    text: text.trim(),
    author: (author || '').trim() || 'Anonymous',
    votes: 0,
    createdAt: new Date().toISOString(),
  };
  ideas.push(idea);
  res.status(201).json(idea);
});

// POST upvote an idea
app.post('/api/ideas/:id/upvote', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idea = ideas.find(i => i.id === id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  idea.votes += 1;
  res.json(idea);
});

// DELETE an idea (admin only — no auth, just for facilitator use)
app.delete('/api/ideas/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = ideas.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Idea not found' });
  ideas.splice(idx, 1);
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  // Print local network IPs so others can connect
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  console.log('\n🏔  Bozeman Offsite Ideas Board is running!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`   Network: http://${ip}:${PORT}  ← share this with the team`));
  console.log('\n   Press Ctrl+C to stop.\n');
});
