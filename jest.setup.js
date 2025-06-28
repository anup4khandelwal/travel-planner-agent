// Jest setup file
// This file runs before all tests to set up the test environment

// Import the Ollama mock for test environment
if (process.env.NODE_ENV === 'test') {
  require('./dist/__mocks__/ollama-mock.js');
}

// Set global timeout for all tests to 30 seconds
jest.setTimeout(30000);
