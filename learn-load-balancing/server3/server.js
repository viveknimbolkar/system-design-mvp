const http = require('http');

const NAME = process.env.SERVER_NAME || 'server1';
const PORT = Number(process.env.PORT) || 3000;

let requests = 0;
let active = 0;
let healthy = true;
let durationSum = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ server: NAME, healthy }));
  }

  // Prometheus text exposition format, hand-rolled to stay dependency-free.
  if (url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    return res.end(
      `# TYPE app_requests_total counter\n` +
        `app_requests_total{server="${NAME}"} ${requests}\n` +
        `# TYPE app_active_requests gauge\n` +
        `app_active_requests{server="${NAME}"} ${active}\n` +
        `# TYPE app_healthy gauge\n` +
        `app_healthy{server="${NAME}"} ${healthy ? 1 : 0}\n` +
        `# TYPE app_request_duration_seconds_total counter\n` +
        `app_request_duration_seconds_total{server="${NAME}"} ${(durationSum / 1000).toFixed(3)}\n`
    );
  }

  // Flip health on/off to watch nginx take this node out of rotation.
  if (url.pathname === '/toggle-health') {
    healthy = !healthy;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ server: NAME, healthy }));
  }

  const started = Date.now();
  active += 1;

  // Artificial latency, useful for comparing round-robin vs least_conn.
  if (url.pathname === '/slow') {
    const ms = Math.min(Number(url.searchParams.get('ms')) || 2000, 30000);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  requests += 1;
  active -= 1;
  durationSum += Date.now() - started;

  res.writeHead(200, { 'Content-Type': 'application/json', 'X-Served-By': NAME });
  res.end(
    JSON.stringify(
      {
        server: NAME,
        port: PORT,
        path: url.pathname,
        requestsHandled: requests,
        pid: process.pid,
        time: new Date().toISOString(),
      },
      null,
      2
    )
  );
});

server.listen(PORT, () => console.log(`${NAME} listening on ${PORT}`));

process.on('SIGTERM', () => server.close(() => process.exit(0)));
