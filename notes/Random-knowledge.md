# rate limiter for distributed system 

- https://freedium-mirror.cfd/https://codefarm0.medium.com/system-design-interview-how-would-you-implement-an-api-rate-limiter-in-a-distributed-environment-6a79f9208305

#### Approaches 
 a. Shred state like counter++
 b. Sliding window - allowing request in specific time interval 
 c. Token Window Algorithm 

1. token bucket algorithm
2. fail open - If something breaks, allow the request/action to continue.
3. fail closed - If something breaks, block the request/action for safety.
4. rate limiting is not only about `counter++`
   
============≠================================

# Ticketing system

https://codefarm0.medium.com/building-a-ticketing-system-concurrency-locks-and-race-conditions-182e0932d962


1. distributed locks
   - Pessimistic Locking — Lock the seat when someone views it
   - Optimistic Locking — Use version numbers/timestamps
   - Database Transactions — Atomic operations
   - Distributed Locks — When multiple servers are involved"
2. redlock algorithm

### What we learned:

1. Concurrency control is critical — Race conditions cause double-booking
2. Distributed locking — Redis for coordinating across multiple servers
3. Two-phase booking — Reservation → Payment → Confirmation
4. Idempotency — Prevent duplicate bookings from retries
5. Compensating transactions — Handle partial failures gracefully

#### Trade-offs Discussed
1. Pessimistic vs Optimistic Locking:

- Pessimistic: Guarantees consistency, but blocks requests
Optimistic: Better performance, but requires retries
2. Simple Redis Lock vs Redlock:

- Simple: Faster, simpler, good for most cases
Redlock: Stronger guarantees, handles Redis failures
3. Lock Duration:

- Short (5–10s): Less blocking, but risk of premature release
Long (30s+): Safer, but more blocking
4. Reservation Timeout:

- Short (5 min): More inventory turnover, better for users
- Long (15 min): Less pressure, worse user experience during flash sales
