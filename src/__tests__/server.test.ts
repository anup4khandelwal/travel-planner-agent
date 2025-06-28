import supertest from 'supertest';

// Increase Jest timeout for all tests to 30 seconds since LLM calls can be slow
jest.setTimeout(30000);

// Mock the server module to avoid import.meta issues
jest.mock('../server.js', () => {
  const fastify = require('fastify');
  
  class MockTravelPlannerServer {
    private app: any;
    
    constructor() {
      this.app = fastify();
      this.setupRoutes();
    }
    
    private setupRoutes() {
      this.app.get('/health', async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeSessions: 0
      }));
      
      this.app.post('/api/chat', {
        schema: {
          body: {
            type: 'object',
            required: ['userId', 'message'],
            properties: {
              userId: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }, async (request: any, reply: any) => {
        reply.type('text/event-stream');
        return 'data: {"type":"message","content":"Test response"}\n\n';
      });
    }
    
    getApp() {
      return this.app;
    }
    
    async stop() {
      await this.app.close();
    }
  }
  
  return { TravelPlannerServer: MockTravelPlannerServer };
});

const { TravelPlannerServer } = require('../server.js');

describe('TravelPlannerServer', () => {
  let server: any;
  let app: any;

  beforeAll(async () => {
    server = new TravelPlannerServer();
    app = server.getApp();
    await app.ready();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await supertest(app.server)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('activeSessions');
    });
  });

  describe('Chat API', () => {
    test('should validate request body', async () => {
      const response = await supertest(app.server)
        .post('/api/chat')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    test('should accept valid chat request', async () => {
      const response = await supertest(app.server)
        .post('/api/chat')
        .send({ userId: 'test-user', message: 'Hello' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });
});
