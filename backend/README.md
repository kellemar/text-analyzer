# Article Analysis API

A serverless article analysis API built with AWS CDK, Hono.js, and OpenAI. This application processes articles (text or documents) to extract key information such as summaries, people, organizations, nationalities, and detected languages using AI-powered analysis.

## Features

- 📄 **Document Processing**: Support for `.txt` and `.docx` file uploads
- 🤖 **AI-Powered Analysis**: OpenAI GPT integration for intelligent content extraction
- 🔐 **User Authentication**: Secure registration and login system
- 📊 **Data Persistence**: PostgreSQL database for storing analysis results
- ☁️ **Serverless Architecture**: AWS Lambda with API Gateway
- 🏗️ **Infrastructure as Code**: AWS CDK for reproducible deployments

## Architecture

The application is built using a serverless architecture on AWS:

- **Frontend**: Simple HTML test interface
- **API**: Hono.js framework running on AWS Lambda
- **Database**: PostgreSQL on AWS RDS
- **Storage**: AWS S3 for file uploads
- **Infrastructure**: AWS CDK for resource management

## Tech Stack

### Backend
- **Framework**: [Hono.js](https://hono.dev/) - Lightweight web framework
- **Runtime**: Node.js 22.x on AWS Lambda
- **Database**: PostgreSQL 17.5 on AWS RDS
- **AI**: OpenAI GPT-4 for content analysis
- **Authentication**: Session-based with bcrypt password hashing

### Infrastructure
- **AWS CDK**: Infrastructure as Code
- **AWS Lambda**: Serverless compute
- **AWS API Gateway**: REST API management
- **AWS RDS**: Managed PostgreSQL database
- **AWS S3**: File storage
- **AWS VPC**: Network isolation

### Key Dependencies
- `hono` - Web framework
- `@ai-sdk/openai` - OpenAI integration
- `mammoth` - DOCX file processing
- `bcryptjs` - Password hashing
- `pg` - PostgreSQL client
- `zod` - Input validation

## API Endpoints

### Authentication

#### POST `/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "access_token": "...",
    "expires_at": "2024-02-01T00:00:00.000Z"
  }
}
```

#### POST `/login`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Analysis

#### POST `/analyze`
Analyze article content and extract key information.

**Content Types Supported:**
- `application/json` - Text content
- `multipart/form-data` - File uploads (.txt, .docx)

**JSON Request:**
```json
{
  "text": "Your article content here..."
}
```

**Form Data Request:**
```
file: [.txt or .docx file]
text: [optional additional text]
```

**Response:**
```json
{
  "article_summary": ["Concise summary of the article"],
  "nationalities": ["American", "British"],
  "organizations": ["United Nations", "NASA"],
  "people": ["John Doe", "Jane Smith"],
  "language": ["English"]
}
```

### Database Migration

#### POST `/add-original-text-column`
Add the `original_text` column to the `article_logs` table. This endpoint is idempotent - it will not fail if the column already exists.

**Request Body:** None required

**Response (Success):**
```json
{
  "message": "Successfully added original_text column to article_logs table",
  "success": true,
  "columnDetails": {
    "column_name": "original_text",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
}
```

**Response (Column Already Exists):**
```json
{
  "message": "Column already exists",
  "success": true,
  "columnExists": true
}
```

**Response (Error):**
```json
{
  "error": "Failed to add original_text column",
  "details": "Error details...",
  "success": false
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  access_token VARCHAR NOT NULL,
  user_agent VARCHAR,
  ip_address VARCHAR,
  expires_at TIMESTAMP NOT NULL
);
```

### Article Logs Table
```sql
CREATE TABLE article_logs (
  id SERIAL PRIMARY KEY,
  summary TEXT[],
  nationalities TEXT[],
  organizations TEXT[],
  people TEXT[],
  language TEXT[],
  original_text TEXT,
  uploaded_file TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Setup and Deployment

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed: `npm install -g aws-cdk`

### Environment Configuration

Set up the following parameters in AWS Systems Manager Parameter Store under `/env/production/`:

- `open-ai-key`: Your OpenAI API key
- `db-username`: Database username
- `db-password`: Database password

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd backend
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Deploy infrastructure:**
```bash
npx cdk bootstrap  # First time only
npx cdk deploy
```

### Local Development

Run the Lambda function locally:
```bash
npm run dev
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run Jest unit tests
- `npm run dev` - Run local development server
- `npx cdk deploy` - Deploy to AWS
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk synth` - Generate CloudFormation template

## Configuration

### Environment Variables
The Lambda function uses the following environment variables (automatically set by CDK):

- `OPENAI_API_KEY` - OpenAI API key from Parameter Store
- `DB_HOST` - RDS endpoint
- `DB_USERNAME` - Database username from Parameter Store
- `DB_PASSWORD` - Database password from Parameter Store
- `DB_PORT` - Database port (5432)
- `DB_SECRET_ARN` - RDS secret ARN for credentials
- `FILE_BUCKET` - S3 bucket name for file uploads
- `RDS_CA_PATH` - Path to RDS CA certificate
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4.1-mini)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: *)

### AWS Resources Created

The CDK stack creates:
- VPC with public/private subnets across 2 AZs
- NAT Gateway for Lambda internet access
- PostgreSQL RDS instance in private subnets
- Lambda function with VPC configuration
- API Gateway REST API
- S3 bucket for file uploads
- Lambda layer with RDS CA certificates
- Security groups for Lambda and RDS communication

## Security Features

- **VPC Isolation**: Lambda and RDS run in private subnets
- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Management**: Secure token-based sessions with expiration
- **SQL Injection Protection**: Parameterized queries
- **File Validation**: Only .txt and .docx files accepted
- **CORS Configuration**: Configurable allowed origins

## File Processing

### Supported Formats
- **Text Files (.txt)**: Direct UTF-8 text processing
- **Word Documents (.docx)**: Text extraction using Mammoth.js
- **Plain Text**: Direct JSON input

### File Size Limits
File uploads are subject to API Gateway limits (10MB by default).

## AI Analysis

The application uses OpenAI's GPT models to extract:

1. **Article Summary**: Concise, factual summaries in detected languages
2. **Nationalities**: Countries and demonyms mentioned
3. **Organizations**: Formal entity names (companies, NGOs, agencies)
4. **People**: Full personal names (excluding titles)
5. **Languages**: Detected languages in the content

## Monitoring and Logging

- CloudWatch Logs for Lambda function output
- Error handling with structured logging
- Database connection pooling for efficiency

## Cost Optimization

- **RDS**: t3.micro instance with automated backups disabled
- **Lambda**: Efficient connection pooling
- **S3**: Lifecycle policies for file cleanup
- **VPC**: Single NAT Gateway across AZs

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure Parameter Store values are correct
2. **OpenAI API Errors**: Verify API key and model availability
3. **File Upload Issues**: Check file format and size limits
4. **CORS Errors**: Configure `ALLOWED_ORIGINS` environment variable

### Logs
Check AWS CloudWatch Logs for detailed error information:
```bash
aws logs tail /aws/lambda/BackendStack-lambda-xxxx --follow
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.