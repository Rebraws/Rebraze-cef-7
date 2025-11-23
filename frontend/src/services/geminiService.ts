import { ChatMessage } from "../types";

// Mock AI service for demo purposes
// This provides canned responses to showcase the design functionality
export const generateChatResponse = async (
  newPrompt: string,
  chatHistory: ChatMessage[]
): Promise<string> => {
  // Simulate network delay for realistic UI behavior
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  // Provide context-aware demo responses
  const prompt = newPrompt.toLowerCase();

  if (prompt.includes('hello') || prompt.includes('hi')) {
    return "Hello! I'm a demo AI assistant. I can help you explore this workspace interface. Try asking me about files, code, or anything else!";
  }

  if (prompt.includes('help') || prompt.includes('what can you do')) {
    return "I'm a demo assistant showcasing the Rebraze AI interface. In a production environment, I would be powered by a real AI model to help you with code analysis, file management, and project insights. For now, I'm demonstrating the chat UI functionality.";
  }

  if (prompt.includes('file') || prompt.includes('code')) {
    return "This is a demonstration of how I would analyze files and code in your workspace. The UI supports features like syntax highlighting, file navigation, and contextual code assistance.";
  }

  if (prompt.includes('project') || prompt.includes('workspace')) {
    return "This workspace interface allows you to manage your project files, chat with an AI assistant, and view code. It's designed to provide a seamless development experience with AI assistance.";
  }

  // Default response
  const responses = [
    "That's an interesting question! In a full implementation, I would provide detailed insights based on your project context.",
    "I'm a demo assistant, so my responses are limited. However, this showcases how the chat interface would work with a real AI model.",
    "Great question! This demonstrates the conversation flow. A production version would have full AI capabilities to assist with your development tasks.",
    "I can see you're exploring the interface. This chat demonstrates how you would interact with an AI assistant in your development environment."
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};
