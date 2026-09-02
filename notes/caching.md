# Caching

## Cache concepts

1. Cache hit ratio
   
    `Cache Hit Ratio = (Hits / Total Requests) * 100`
    
    Total Requests = 1000
    Hits = 900
    Misses = 100
    
    900 / 1000 * 100 = 90% HIT RATIO

2. Cache Miss Ratio
    Miss Ratio = (Misses / Total Requests) * 100
    
    100 misses
    1000 requests
    = 10%
    
    Hit ratio + miss ratio = 100%

3. cache throughput - Number of requests processed per second.
4. cache latency- Time needed to retrieve data from cache store

## Cache Types
1. In memory cache
   - Data is stored in RAM (memory) instead of disk.
2. local cache
   - Cache maintained inside a single application instance. Stored within application's memory.
3. distributed cache
   - A cache shared by multiple servers (Redis)
4. application cache
   - Cache managed at application level.
5. database cache
   - Some databases maintain their own cache.
6. browser cache
   - data stored in browser (sessions, indexDB, cookies)
7. cdn cache
   - data stored at CDN and edge nodes
8. dns cache
   - data stored in dns servers(root dns, local dns, application dns servers)
9. cpu cache (cpu->l1->l2->l3->ram)
   - l1 cache - inside cpu core (fastest)
   - l2 cache - (bigger)
   - l3 cache - shared by cpu cores (largest)


## Cache Loading Strategies
**1. Cache Aside (Most Common)**\
Application checks cache first. If data is not found then -
    1. Read from Database
    2. Save into Cache
    3. Return response
    
**2. Read Through**\
Application talks only to cache. Cache itself fetches data from database when needed.

**4. Write Through**\
DB data changed, then cache data is outdated. So, update cache then db

**6. Write Behind (Write Back)**\
Update cache first, the update db asynchronously behind the scene

**8. Refresh Ahead**\
Update the cache just before is about to expire
Cache Entry -> About to Expire -> Background Refresh -> Cache Updated

## Cache Eviction Policies
Cache memory is limited. What happens when cache becomes full? When cache is full, the system must decide: Which data should be removed.

### Types of cache eviction policies
1. LRU (Most Important)
2. LFU
3. FIFO
4. MRU
5. Random
6. ARC

**1.LRU (Least Recently Used)** - Remove the item that hasn't been used for the longest time\
**2.LFU (Least Frequently Used)** - Remove data used the least number of times\
**3. FIFO (First In First Out)** - Remove oldest data first. Just like a queue\
**MRU (Most Recently Used)** - Opposite of LRU. Remove the most recently used item\
**5. Random Replacement** - Remove a random item\
**6. ARC (Adaptive Replacement Cache)** - Combines LRU + LFU behavior\

























