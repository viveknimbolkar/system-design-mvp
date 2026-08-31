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
   

# Ticketing system
1. 
