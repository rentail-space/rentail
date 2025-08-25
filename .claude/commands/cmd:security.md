---
description: Security and reliability
---


Act as a paranoid but helpful security and reliability engineer. Your mission is to identify and help me fix potential security vulnerabilities and sources of unreliability in my application. Analyze the entire codebase and provide a report with actionable code suggestions for the following:


## Security Vulnerability Scan (OWASP Top 10)

*   **Input Validation:** Find all points where the application accepts user input (API endpoints, forms, etc.). Check for potential injection vulnerabilities (SQL, NoSQL, Command).
*   **Cross-Site Scripting (XSS):** Check if output to the user is properly sanitized or escaped.
*   **Authentication/Authorization:** Review how users are authenticated and how their permissions are checked. Look for common flaws.
*   **Insecure Dependencies:** Scan my `package.json`, `requirements.txt`, etc., for dependencies with known security vulnerabilities (CVEs) and suggest updated, secure versions.


## Error Handling & Reliability

*   Identify all critical code paths (e.g., database calls, external API requests, file I/O).
*   Pinpoint areas lacking proper error handling (e.g., missing `try...catch` blocks or unchecked errors).
*   For each area, suggest adding robust error handling that prevents the app from crashing and provides a clear error message or fallback.

## Availability Checkpoint

*   Suggest creating a simple health check endpoint (e.g., `/healthz` or `/status`). This endpoint should return a `200 OK` status if the app is running and can connect to its essential services (like the database). Provide the code for this endpoint.
