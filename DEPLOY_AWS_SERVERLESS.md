# Deploy FinTrack Pro on AWS Serverless

This project can be deployed as:
- Frontend (`Next.js`) -> `AWS Amplify Hosting`
- Backend (`Node.js + Express`) -> `AWS Lambda + API Gateway` via `AWS SAM`
- AI Service (`Python FastAPI`) -> `AWS Lambda + HTTP API` via `AWS SAM`
- Database -> `MongoDB Atlas` (already managed)

## 1) Prerequisites

- AWS account with permissions for Lambda, API Gateway, CloudFormation, IAM, S3, Amplify.
- AWS CLI configured: `aws configure`
- SAM CLI installed: `sam --version`
- Node.js 18+, Python 3.11+
- MongoDB Atlas URI
- OpenAI API key

## 2) Deploy AI Service (FastAPI) first

Backend depends on AI service URL, so deploy AI first.

```bash
cd ai-service
sam build
sam deploy --guided
```

Use these values in guided deploy:
- Stack name: `fintrack-ai-service`
- AWS Region: your preferred region (for example `ap-south-1`)
- Parameter `OpenAiApiKey`: your real OpenAI key

After deployment, capture output:
- `AiServiceUrl` (example: `https://xxxx.execute-api.ap-south-1.amazonaws.com/prod`)

Quick health check:

```bash
curl <AiServiceUrl>/health
```

## 3) Deploy Backend Service (Express) with AI URL

```bash
cd ../backend
sam build
sam deploy --guided
```

Provide these parameter values during deploy:
- `MongoUri`: your MongoDB Atlas connection string
- `JwtSecret`: strong JWT secret
- `AiServiceUrl`: output from AI stack (`AiServiceUrl`)

After deployment, capture:
- `BackendApiUrl` output

Quick health check:

```bash
curl <BackendApiUrl>/api/health
```

## 4) Deploy Frontend on Amplify (Next.js)

1. Push repository to GitHub (if not already).
2. In AWS Console -> Amplify -> **New app** -> **Host web app**.
3. Connect repository and select branch.
4. Set environment variable in Amplify:
   - `NEXT_PUBLIC_API_URL=<BackendApiUrl>/api`
5. Deploy.

For this repo, Amplify auto-detects Next.js build settings. If needed, use:
- Build command: `npm run build`
- Output directory: `.next`

## 5) Post-deploy validation checklist

- Frontend opens and login/signup works.
- `GET /api/health` returns `{"status":"ok"}`.
- AI routes respond from backend:
  - `/api/ai/insights`
  - `/api/ai/predict`
  - `/api/ai/recommend`
- New expenses are stored in MongoDB Atlas.

## 6) Recommended production hardening

- Restrict CORS origins (replace `"*"` in templates with frontend domain).
- Store secrets in AWS Secrets Manager or SSM Parameter Store.
- Add CloudWatch alarms for 5xx errors and Lambda throttles.
- Configure custom domains on Amplify and API Gateway.
