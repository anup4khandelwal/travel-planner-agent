import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { DialogManager } from './core/dialog-manager.js';
import { SessionManager } from './core/session-manager.js';
import { ChatRequest, ChatRequestSchema } from './types/schemas.js';

// Handle __dirname for ES modules and Jest compatibility
const __dirname: string = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // Fallback for Jest environment
    return process.cwd();
  }
})();

export class TravelPlannerServer {
  private app: FastifyInstance;
  private dialogManager: DialogManager;
  private sessionManager: SessionManager;

  constructor() {
    this.app = fastify({ 
      logger: {
        transport: {
          target: 'pino-pretty'
        }
      }
    });
    this.dialogManager = new DialogManager();
    this.sessionManager = new SessionManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private async setupMiddleware() {
    // CORS configuration
    await this.app.register(cors, {
      origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        // Add your deployment domain here
        /\.railway\.app$/,
        /\.vercel\.app$/,
        /\.netlify\.app$/
      ],
      credentials: true
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeSessions: this.sessionManager.getActiveSessions()
      };
    });

    // Main chat endpoint with SSE streaming
    this.app.post('/api/chat', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate request body
        const validationResult = ChatRequestSchema.safeParse(request.body);
        
        if (!validationResult.success) {
          reply.code(400).send({
            error: 'Invalid request',
            details: validationResult.error.errors
          });
          return;
        }

        const { userId, message }: ChatRequest = validationResult.data;

        // Set up SSE headers
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial processing message
        this.sendSSEMessage(reply, {
          type: 'status',
          content: 'Processing your request...'
        });

        // Process the message
        const response = await this.dialogManager.processMessage(userId, message);

        // Send the main response
        this.sendSSEMessage(reply, response);

        // Send completion signal
        this.sendSSEMessage(reply, {
          type: 'complete',
          content: 'Response complete'
        });

        reply.raw.end();

      } catch (error) {
        console.error('Chat endpoint error:', error);
        
        this.sendSSEMessage(reply, {
          type: 'error',
          content: 'An unexpected error occurred. Please try again.'
        });
        
        reply.raw.end();
      }
    });

    // Get session info endpoint
    this.app.get('/api/session/:userId', async (request: FastifyRequest<{
      Params: { userId: string }
    }>, reply) => {
      try {
        const { userId } = request.params;
        const session = this.sessionManager.getSession(userId);
        
        return {
          userId: session.userId,
          intent: session.intent,
          stage: session.stage,
          conversationHistory: session.conversationHistory.slice(-10) // Last 10 messages
        };
      } catch (error) {
        reply.code(500).send({ error: 'Failed to retrieve session' });
      }
    });

    // Clear session endpoint
    this.app.delete('/api/session/:userId', async (request: FastifyRequest<{
      Params: { userId: string }
    }>, reply) => {
      try {
        const { userId } = request.params;
        this.sessionManager.clearSession(userId);
        
        return { message: 'Session cleared successfully' };
      } catch (error) {
        reply.code(500).send({ error: 'Failed to clear session' });
      }
    });

    // Static file serving for demo frontend
    this.app.register(staticFiles, {
      root: path.join(__dirname, '../public'),
      prefix: '/'
    });

    // Serve demo page at root
    this.app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.sendFile('index.html');
    });
  }

  /**
   * Send Server-Sent Event message
   */
  private sendSSEMessage(reply: FastifyReply, data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    reply.raw.write(message);
  }

  /**
   * Start the server
   */
  async start(port: number = 3000): Promise<void> {
    try {
      await this.app.listen({ port, host: '0.0.0.0' });
      console.log(`🚀 Travel Planner Agent server running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`💬 Chat API: POST http://localhost:${port}/api/chat`);
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    try {
      await this.app.close();
      console.log('Server stopped gracefully');
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }

  /**
   * Get Fastify instance for testing
   */
  getApp(): FastifyInstance {
    return this.app;
  }
}
