
# Text Analyzer Pro: Quick Reference

## Assumptions & Limitations

### File Upload Constraints
- **Supported Formats**: Only `.txt` and `.docx` files are accepted for text analysis
- **File Size Limit**: Maximum upload size of 10MB per file to prevent performance issues and resource exhaustion
- **File Validation**: Files must pass MIME type validation and virus scanning before processing
- **Encoding Support**: Text files must be UTF-8 encoded for proper character handling
- **Content Restrictions**: Files containing only images, tables, or non-text elements may not be processed effectively

### Authentication & Security
- **API Authentication**: All analysis endpoints require valid JWT tokens or API keys
- **Rate Limiting**: API calls are limited to prevent abuse (e.g., 100 requests per hour per user)
- **User Sessions**: Session timeout after 30 minutes of inactivity for security
- **Data Privacy**: Uploaded files are temporarily stored and automatically deleted after 24 hours
- **HTTPS Only**: All communications must use secure HTTPS connections

### Infrastructure Dependencies
- **AWS Deployment**: Backend services must be deployed on AWS infrastructure
- **Parameter Store**: Sensitive configuration values stored in AWS Systems Manager Parameter Store
- **Required Secrets**:
  - OpenAI API key with sufficient quota and permissions
  - Database connection strings (for RDS Postgres)
  
### Third-Party Service Dependencies
- **OpenAI API**: 
  - Requires active subscription to OpenAI with available tokens
  - Subject to OpenAI's rate limits and service availability
  - Potential costs based on token usage
- **Database Requirements**: 
  - PostgreSQL 12+ or compatible RDS instance
  - Minimum 2GB RAM and 20GB storage allocated

### Browser & Client Limitations
- **CORS Policy**: Cross-origin requests handled by backend configuration
- **Browser Compatibility**: Supports modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **JavaScript Required**: Client-side functionality requires JavaScript enabled
- **Local Storage**: Uses browser local storage for temporary data and user preferences

### Performance & Scalability
- **Processing Time**: Large documents may take 30-60 seconds to analyze
- **Concurrent Users**: System optimized for up to 100 concurrent users
- **Memory Usage**: Each analysis session may consume up to 512MB of server memory

### Content Analysis Limitations
- **Language Support**: Able to handle multiple languages in a document text
- **Document Structure**: Complex formatting, headers, and footnotes may not be preserved
- **Technical Content**: Highly specialized or technical jargon may affect analysis quality
- **Minimum Content**: Documents must contain at least 100 words for meaningful analysis

## Bonus Points Added
- Handles multiple language articles
- Detect organizations and people
- Save uploaded document text and summaries to databse (Postgres RDS)
- Add user authentication
- S3 Uploads for either .txt or .docx files
- Websocket not added (but considered when doing 10,000 requests in an hour).

But for a Websocket setup, this would used to provide real-time updates to the client on what is the progress of the analysis, better responsive feedback on the analysis without refreshing the page, and create push notifications to the user to inform them that the analysis is done.


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