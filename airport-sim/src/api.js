export async function fetchToday() {
  const res = await fetch('/api/flights/today');
  if (!res.ok) throw new Error('failed to fetch today status');
  return res.json();
}

export async function registerFlight({ name, desc, link }) {
  const res = await fetch('/api/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, desc, link: link || undefined }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'registration failed');
  return data;
}
