import { Hono } from 'hono';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import mammoth from 'mammoth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const outputSchema = z.object({
  article_summary: z
    .array(z.string())
    .describe('Summaries of the article; multiple languages allowed'),
  nationalities: z.array(z.string()).describe('Nationalities or countries'),
  organizations: z.array(z.string()).describe('Organizations'),
  people: z.array(z.string()).describe('People'),
  language: z
    .array(z.string())
    .optional()
    .describe('Languages detected'),
});

export const registerAnalyzeRoute = (app: Hono) => {
  app.post('/analyze', async c => {
    let articleText = '';
    let uploadedFileUrl: string | null = null;
    const contentType = c.req.header('content-type') || '';

    try {
      if (contentType.includes('multipart/form-data')) {
        const form = await c.req.formData();
        const parts: string[] = [];

        // Optional text input
        const textField = form.get('text');
        if (typeof textField === 'string' && textField.trim()) {
          parts.push(textField.trim());
        }

        // Optional file upload
        const file = form.get('file') as unknown as File | null;
        if (file) {
          const arrayBuffer = await (file as any).arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let extractedText = '';
          if (file.name.endsWith('.txt')) {
            extractedText = buffer.toString('utf-8');
          } else if (file.name.endsWith('.docx')) {
            const { value } = await (mammoth as any).extractRawText({ buffer });
            extractedText = value;
          } else {
            return c.json(
              {
                error: 'Unsupported file type. Only .txt and .docx are accepted.',
              },
              400,
            );
          }

          // Upload file to S3
          try {
            const fileId = uuidv4();
            const fileExtension = file.name.split('.').pop() || 'txt';
            const s3Key = `uploads/${fileId}.${fileExtension}`;
            
            const uploadCommand = new PutObjectCommand({
              Bucket: process.env.FILE_BUCKET!,
              Key: s3Key,
              Body: buffer,
              ContentType: file.type || 'application/octet-stream',
              Metadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
              },
            });

            await s3Client.send(uploadCommand);
            uploadedFileUrl = `s3://${process.env.FILE_BUCKET}/${s3Key}`;
          } catch (s3Error) {
            console.error('S3 upload error:', s3Error);
            // Continue processing even if S3 upload fails
          }

          parts.push(extractedText);
        }

        articleText = parts.join('\n\n');
        if (!articleText) {
          return c.json({ error: 'No article text provided' }, 400);
        }
      } else {
        const body = await c.req.json().catch(() => ({}));
        articleText = body.text ?? '';
        if (!articleText) {
          return c.json({ error: 'No article text provided' }, 400);
        }
      }
    } catch (err) {
      console.error('Body parsing error', err);
      return c.json({ error: 'Failed to parse body' }, 400);
    }

    let result;
    try {
      result = await generateObject({
        model: openai(process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'),
        schema: outputSchema,
        output: 'object',
        system: `You are an expert information-extraction engine from text.`,
        prompt: `
        # INSTRUCTIONS
        Return ONLY valid JSON that conforms exactly to the provided Zod schema - no markdown, comments, or extra keys.
        Extraction rules:
        1. article_summary - concise, neutral and factual. If the article is in multiple languages, create summaries for each language.
        2. nationalities - deduplicated demonyms or country names in the article text. This can be in any language.
        3. organizations - formal names of groups, agencies, NGOs, companies, alliances, etc. This can be in any language.
        4. people - full personal names (skip titles alone).
        5. language - the languages of the article, e.g. "English", "Spanish", "French".
       
        If a list would otherwise be empty, return an empty array for that key.

        ### ARTICLE\n${articleText}\n\n### TASK\nDetect the language of the article first. Then summarize the article and extract the required entities.\nReturn the JSON object only`,
      });
    } catch (err) {
      console.error('OpenAI error', err);
      return c.json({ error: 'Failed to analyze article' }, 500);
    }

    try {
      const db = getPool();
      await db.query(
        'INSERT INTO article_logs(summary, nationalities, organizations, people, language, original_text, uploaded_file) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          result.object.article_summary,
          result.object.nationalities,
          result.object.organizations,
          result.object.people,
          result.object.language || 'unknown',
          articleText,
          uploadedFileUrl,
        ],
      );
    } catch (err) {
      console.error('DB error', err);
    }

    return c.json(result.object);
  });
};
