import { TravelPlannerServer } from './server.js';

async function main() {
  const server = new TravelPlannerServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  // Start the server
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  await server.start(port);
}

// Run the application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
