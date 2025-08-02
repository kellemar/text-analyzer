
# Text Analyzer Pro: Quick Reference

## Setup Instructions

**Prerequisites:**
- Node.js 18+
- npm or yarn
- AWS CLI configured (for backend deployment)
- AWS CDK CLI (`npm install -g aws-cdk`)

**Installation:**
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd text-analyzer
   ```
2. Install dependencies:
   - Frontend:
     ```bash
     cd frontend
     npm install
     ```
   - Backend:
     ```bash
     cd ../backend
     npm install
     ```

**Environment Configuration:**
- Frontend: Create `frontend/.env.local` with `VITE_ANALYZER_API_URL=https://your-api-endpoint.com`
- Backend: Set secrets in AWS Parameter Store for production (`open-ai-key`, `db-username`, `db-password`).

## Deployment Notes

- Frontend can be deployed to Vercel, Netlify, AWS S3 + CloudFront, or any static host.
- Backend is deployed to AWS Lambda via CDK
  Run "aws configure" once you have downloaded and installed the AWS CLI. Be ready with your AWS Client and Secret keys.

  ```bash
  cd backend
  npx cdk bootstrap  # First time only
  npx cdk deploy
  ```
- Ensure all environment variables and secrets are set for production.

## API Documentation

**POST `/signup`** — Register a user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST `/login`** — Authenticate a user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST `/analyze`** — Analyze text or file
- Accepts: `application/json` (with `text`) or `multipart/form-data` (with `file`)
- Response example:
```json
{
  "summary": "Generated summary text",
  "countries": ["Country1", "Country2"],
  "organizations": ["Org1", "Org2"],
  "people": ["Person1", "Person2"],
  "language": ["English"]
}
```

## Assumptions & Limitations

- Only `.txt` and `.docx` files are supported for upload (max 10MB).
- API requires valid authentication for analysis endpoints.
- Backend must be deployed on AWS with required secrets set in Parameter Store.
- OpenAI API key and database credentials must be provided.
- CORS and session management are handled by the backend.

## Bonus Points Added
- Handles multiple language articles
- Detect organizations and people
- Save uploaded document text and summaries to databse (Postgres RDS)
- Add user authentication
- S3 Uploads for either .txt or .docx files
- Websocket not added (but considered when doing 10,000 requests in an hour).

But for a Websocket setup, this would used to provide real-time updates to the client on what is the progress of the analysis, better responsive feedback on the analysis without refreshing the page, and create push notifications to the user to inform them that the analysis is done.
