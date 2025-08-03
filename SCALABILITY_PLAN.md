# Scalability Plan for Handling 10,000 Requests per Hour

This document outlines the steps and architectural changes needed to scale the Text Analyzer system to handle 10,000 requests per hour which approximates to about 2.8 requests per second.

There is another limitation to take note of, which is the rate limits that OpenAI imposes on its API.

These are the steps that we need to do, to accomplish that goal of handling 10,000 requests per hour.

The client flow becomes: Upload → Queue Analysis Request Jobs → Background Processing of Text → Results, which is more scalable than synchronous processing.


## 1. Optimize the database

### Increase Connection Pool Size
- Update your database pool configuration to allow more concurrent connections to max 20, minimum of 5.

### Upgrade RDS Instance
- Use a larger RDS instance to a T3 Large (2 vCPUs and 8gb RAM)
- Increase allocated storage to 40gb and enable performance insights to monitor the load and connections usage on the database.

## 2. Background Job Processing with SQS
- Add an SQS queue for analysis jobs, so all user requests are sent straight to the queue. This prevents on-demand usage from overloading the server with large number of requests at a time.
- Create a dedicated Lambda function to consume the queue and process analysis in the background.
- Use a Dead Letter Queue (DLQ) for failed jobs.

## 3. Direct S3 Upload with Presigned URLs
- Implement an endpoint to generate presigned S3 upload URLs.
- Users upload files directly to S3.
- After upload, enqueue a message to SQS for background processing.

## 4. Background Processor Lambda
- Lambda function downloads the file from S3, runs analysis, and stores results in the database.
- Ensure proper error handling and logging.

## 5. Lambda Concurrency and Performance
- Increase Lambda memory and reserved concurrency (e.g., 50-100 concurrent executions).
- Tune timeouts and batch sizes for SQS event source.

## 6. Database Indexing
- Add indexes to frequently queried columns (e.g., `users.email`, `articles.user_id`, `articles.created_at`).
- Use concurrent index creation for large tables.

## 7. API Rate Limiting
- Set API Gateway throttling (e.g., 1000 requests/sec, burst 2000).
- Implement per-user rate limits in the application if needed.

## 8. WebSocket (Optional for Real-Time Updates)
- Use WebSockets to provide real-time progress updates to clients.
- Push notifications when analysis is complete.

## 10. 2 OpenAI accounts to handle rate limits
- gpt-4.1-mini has a rate limit of 500 requests per minute on the 1st usage level.
- Having 2 accounts which oscillate between each other randomly will reduce the change of hitting rate limit errors.
- If there is more usage, the usage tier will increase to accomodate higher rate limits (5,000 - 10,000 requests per limit).

## Summary

This architecture will handle 10,000 requests/hour by:
- Decoupling upload from processing using SQS
- Scaling database connections and instance size
- Processing files asynchronously in the background
- Adding proper database indexes for fast queries
- Implementing rate limiting and concurrency controls
- Using presigned URLs for direct S3 uploads
- Dual OpenAI accounts to handle rate limit issues