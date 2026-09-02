# Load Balancing Lab

A small hands-on setup to learn how load balancing actually works.

**3 identical Node servers, nginx sitting in front of them, and Grafana to watch what happens.**
Everything runs in containers. The idea is to break things on purpose and watch the graphs.

---

## What's in this folder

```
server1/ server2/ server3/   3 copies of the same tiny Node app (no npm packages)
nginx/nginx.conf             the load balancer config - this is the file that matters
monitoring/                  Prometheus + a ready-made Grafana dashboard
docker-compose.yml           starts everything
```

The three servers are identical on purpose. Each one only knows its own name, so you can tell who answered.

## How to run it

```bash
podman compose up -d --build      # or: docker compose
```

| URL | What |
|---|---|
| http://localhost:8080 | the app, through the load balancer |
| http://localhost:3001 / 3002 / 3003 | each server directly, so you can compare |
| http://localhost:3000 | Grafana dashboard ("Load Balancing Lab") |
| http://localhost:9090 | Prometheus (the raw numbers) |

Things the servers respond to:

| Path | Does what |
|---|---|
| `/` | normal reply, tells you which server handled it |
| `/health` | says whether this server thinks it's OK |
| `/toggle-health` | makes a server pretend to be sick |
| `/slow?ms=2000` | takes 2 seconds to reply, to fake a heavy request |
| `/metrics` | numbers for Prometheus |

nginx also has `/nginx-health` and `/stub_status`.

```bash
# watch it take turns between servers
for i in $(seq 9); do curl -s --noproxy '*' localhost:8080 | grep server; done

# throw real traffic at it
NO_PROXY='*' hey -c 100 -z 60s http://localhost:8080/
```

> Heads up: if you rebuild or recreate a server container, **restart nginx too**. Otherwise nginx keeps calling the old address and that server disappears. Lesson 1 explains why.

---

## What I learned

**1. nginx looks up server addresses only once, when it starts.**
If a container is recreated it gets a new IP address, and nginx never finds out. That server is dead to nginx until you restart or reload it. Real setups fix this with service discovery (Kubernetes, Traefik, Consul) - something that tells the load balancer when servers move.

**2. Taking turns is not the same as being fair.**
Round-robin gives each server the same *number* of requests. But requests aren't equally expensive. One slow request can tie up a server while the load balancer happily keeps sending it more. `least_conn` fixes this by looking at who is actually busy.

**3. Saying no quickly is what keeps you alive.**
In a 5-minute test, 721,000 requests arrived. Only 3,020 were let through, the rest got a 429, and the servers stayed almost idle. If nginx had accepted everything, it would have done all that work and delivered nothing, because everything would have timed out.

**4. Most of a request's time is spent waiting in line.**
Measured 41ms per request, but the real work only took about 13ms. The other 28ms was queueing. Bigger queues don't give you more capacity - they just make people wait longer.

**5. A load balancer hides failures from users, and also from you.**
When one server died, the other two covered for it and nobody noticed. Great for users, dangerous for you - you'd be paying for a machine doing nothing. That's the whole reason Grafana is in this lab.

**6. Servers have to be stateless.**
Each server counts its own requests and the numbers never match. Anything kept in memory - login sessions, uploaded files, caches - breaks the moment there's a second server.

**7. Averages lie.**
Average response time looked fine in every test, including the broken ones. Look at p99 (the slowest 1%) - that's what people actually complain about.

---

## Problems that happen in real life

| Problem | What goes wrong | What fixes it |
|---|---|---|
| **Retry storm** | One server gets slow. The load balancer retries onto the healthy ones, so load triples right when you can least afford it. Everything falls over. | Limit retries (`proxy_next_upstream_tries 2`). Never retry payments or anything that writes data. |
| **Old address after deploy** | Container recreated, load balancer keeps calling the old IP. | Reload the load balancer, or use service discovery. |
| **Errors on every deploy** | Server gets shut down while it's still receiving traffic. | Take it out of rotation first, wait a moment, then shut it down. |
| **Fresh server falls over** | A just-started server gets a third of all traffic instantly, chokes, restarts, repeats forever. | Ramp its traffic up slowly. |
| **Health check that lies** | `/health` says OK because the app is running, but the database behind it is down. | Check dependencies too. "Am I running?" and "can I actually serve?" are different questions. |
| **One slow page ruins everything** | A heavy report request eats all the connections, so normal pages get slow too. | Give heavy routes their own separate pool. |
| **A whole office gets blocked** | Hundreds of people share one office IP, so a per-IP rate limit blocks all of them. | Limit per user or API key, not per IP. |
| **Running out of connections** | Without keepalive, every request opens a brand new connection. Eventually you run out. | Keep `proxy_http_version 1.1` and `Connection ""` in the config. |
| **Losing 1 server kills all 3** | You were at 70% capacity. Lose one of three, the survivors get 105% each and die too. | Plan capacity assuming one server is always missing. |
| **Duplicate orders** | The load balancer gives up after 2s and retries, but the first request was still working. Customer gets charged twice. | Timeouts should get shorter as you go deeper (client > LB > app > database). Use idempotency keys. |
| **Faked client IP** | `X-Forwarded-For` is just a header - anyone can set it. | Only trust it when it comes from a proxy you control. |

---

## Every concept, in one place

### Ways to pick a server
| Name | What it means |
|---|---|
| Round-robin | Take turns. Simple, and the default. Doesn't know or care how busy a server is. |
| Weighted | `weight=3` means "send this one 3x more". Good for bigger machines, or slowly shifting traffic to a new version. |
| Least connections | Send to whoever is handling the fewest requests right now. Better when some requests are slow. |
| IP hash | The same visitor always goes to the same server. Breaks when you add or remove servers. |
| Consistent hashing | Same idea, but adding a server only reshuffles a small portion instead of everything. |
| Power of two choices | Pick 2 servers at random, use the less busy one. Almost as good as least connections, much cheaper. What modern systems use. |

### Dealing with failure
| Name | What it means |
|---|---|
| Passive health check | Find out a server is broken by watching real requests fail. Free, but your users discover the problem for you. |
| Active health check | Ping `/health` on a schedule. Catches problems before users do. Paid nginx or Envoy only. |
| Liveness vs readiness | Liveness = the process is running. Readiness = it can actually handle traffic. Not the same thing. |
| Retry / failover | If one server fails, quietly try another so the user never sees an error. |
| Circuit breaker | After enough failures, stop calling that server for a while. Gives it room to recover. |
| Outlier detection | Kick out a server that's noticeably worse than the others, not just one that's completely down. |
| Graceful shutdown | Stop taking new requests, finish the ones in progress, then exit. |
| Slow start | Ease a fresh server in instead of hitting it at full speed immediately. |

### Protecting yourself
| Name | What it means |
|---|---|
| Rate limiting | "Max 10 requests per second per person." Works like a leaky bucket. |
| Burst | Allowance for short spikes. Real users are bursty - one page load fires 15 requests at once. |
| nodelay | Let the burst through immediately instead of slowing it down. Usually what you want. |
| Connection limit | Cap how many connections one client can hold open. Catches slow attacks that rate limits miss. |
| max_conns | Cap how many requests each server handles at once, so you don't overload it. |
| Load shedding | Deliberately turn some traffic away so the rest stays fast. |
| Backpressure | Tell the caller to slow down instead of quietly piling up work. |

### The plumbing
| Name | What it means |
|---|---|
| Upstream | The named list of backend servers. |
| Reverse proxy | Sits in front, forwards requests, hides what's behind it. |
| Keepalive | Reuse connections instead of opening a new one every time. Big performance win. |
| TLS termination | The load balancer handles HTTPS and talks plain HTTP to the servers behind it. |
| X-Forwarded-For | Header that carries the real visitor's IP through proxies. Can be faked. |
| Sticky sessions | Pin a visitor to one server. A workaround for apps that keep data in memory. |
| L4 vs L7 | L4 just moves TCP around - fast but blind. L7 understands HTTP, so it can route, retry and cache. |
| Service discovery | Something that keeps the load balancer's server list up to date automatically. |
| Control plane / data plane | The data plane moves traffic. The control plane decides the rules. Separating them is the modern approach. |

### Measuring things
| Name | What it means |
|---|---|
| p50 / p95 / p99 | Percentiles. p99 = the slowest 1% of requests. That's what people complain about. |
| Little's Law | `requests in flight = rate x latency`. Tells you whether you're queueing. |
| Head-of-line blocking | A quick request stuck waiting behind a slow one. |
| Thundering herd | Everyone retries at the same moment and knocks things over again. |
| Tail latency | When one page needs 20 backend calls, the slowest one decides your speed. |

---

## The short version

A load balancer does four things: **spread traffic**, **hide failures**, **protect the servers behind it**, and **be observable**.

Everything else is a detail of one of those four.

Spreading traffic is the easy part - a few lines of config. The hard part is what happens when things break: noticing a server is dead, not making it worse by retrying, and turning traffic away early enough to survive.