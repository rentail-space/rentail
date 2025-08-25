---
description: Improve app performance
---


Act as a Site Reliability Engineer (SRE) focused on performance and observability. Your goal is to ensure my application can handle growth and that I can diagnose problems in production. Analyze the codebase and suggest improvements in these areas:


## Performance Bottlenecks

*   **Database Queries:** Identify any database queries performed inside loops (N+1 query problem). Suggest how to optimize them into a single, more efficient query.
*   **Heavy Computations:** Find any computationally expensive operations or inefficient algorithms that could block the main thread or slow down responses. Suggest optimizations or asynchronous execution.
*   **Data Handling:** Look for places where the app loads very large amounts of data into memory at once. Suggest using pagination, streaming, or chunking.


## Observability - Logging & Metrics

*   **Structured Logging:** Review my current logging (or lack thereof). Propose a structured logging strategy (e.g., JSON format). Refactor 3-5 key `console.log` or `print` statements to use this new structured logger, including important context like user ID or request ID.
*   **Key Metrics:** Identify the 3 most important metrics for my application's health (e.g., API request latency, error rate, number of active users). Show me where and how to instrument the code to capture these metrics, even if it's just with a logging statement for now.


## Scalability Review

*   Identify anything that would prevent me from running multiple instances of this application (horizontal scaling). This usually involves checking for in-memory state that should be moved to a shared store like a database or Redis (e.g., session stores, caches, locks).
