import { VertexAI } from '@google-cloud/vertexai';
import { SpeechClient } from '@google-cloud/speech';
import { Injectable, Logger } from '@nestjs/common';
import { JWT } from 'google-auth-library';

@Injectable()
export class GoogleCloudService {
  private ai: VertexAI;
  private speechClient: SpeechClient;
  private readonly logger = new Logger(GoogleCloudService.name);

  constructor() {
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}',
    ) as {
      client_email: string;
      private_key: string;
      project_id: string;
    };

    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    this.ai = new VertexAI({
      project: credentials.project_id,
      location: 'us-central1',
      googleAuthOptions: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        authClient: client as any,
      },
    });

    // Initialize Speech-to-Text client
    this.speechClient = new SpeechClient({
      projectId: credentials.project_id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      authClient: client as any,
    });
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.log(`Generating text for prompt: ${prompt}`);

    const systemPrompt = 'You are a helpful financial assistant.';

    const model = this.ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      const response = result.response;
      const text = response.candidates?.[0]?.content.parts?.[0]?.text || '';
      return text;
    } catch (error) {
      this.logger.error('Famo chat error:', error);
      throw new Error('Failed to generate farming advice');
    }
  }
}
