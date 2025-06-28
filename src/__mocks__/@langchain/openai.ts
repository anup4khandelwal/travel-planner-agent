// Mock for @langchain/openai
export class ChatOpenAI {
  constructor(config: any) {
    // Mock implementation
  }

  async invoke(prompt: string) {
    return "Mock OpenAI response";
  }
}
