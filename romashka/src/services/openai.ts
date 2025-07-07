import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const openaiService = {
  async generateResponse(message: string, context: any) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: `You are ROMASHKA, a helpful AI customer service agent. 
            Context: ${JSON.stringify(context)}
            Respond naturally and helpfully. Keep responses concise and friendly.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }
  },

  async enhanceMessage(baseMessage: string, context: any) {
    try {
      const prompt = `Make this message more natural and conversational while keeping the same meaning: "${baseMessage}"`;
      return await this.generateResponse(prompt, context);
    } catch (error) {
      console.error('Message enhancement error:', error);
      return baseMessage; // Fallback to original message
    }
  },

  async evaluateCondition(condition: string, context: any) {
    try {
      const prompt = `Evaluate this condition based on the context. Respond with only "true" or "false":
      Condition: ${condition}
      Context: ${JSON.stringify(context)}
      
      Available data: ${JSON.stringify(context.collectedData || {})}
      User message: ${context.userMessage || ''}`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a condition evaluator. Respond with only 'true' or 'false'."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      
      const result = response.choices[0].message.content?.toLowerCase().trim();
      return result === 'true';
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false; // Default to false on error
    }
  },

  async generateInputPrompt(inputType: string, context: any) {
    try {
      const prompts = {
        email: "Could you please provide your email address?",
        name: "What's your name?",
        phone: "Could you share your phone number?",
        company: "What company do you work for?",
        message: "How can I help you today?",
        default: "Please provide the requested information."
      };
      
      const basePrompt = prompts[inputType as keyof typeof prompts] || prompts.default;
      return await this.enhanceMessage(basePrompt, context);
    } catch (error) {
      console.error('Input prompt generation error:', error);
      return "Please provide the requested information.";
    }
  },

  async extractDataFromMessage(message: string, inputType: string) {
    try {
      const prompt = `Extract the ${inputType} from this message. If found, respond with just the value. If not found, respond with "not_found":
      Message: "${message}"
      Type: ${inputType}`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data extractor. Respond with only the extracted value or 'not_found'."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50
      });
      
      const result = response.choices[0].message.content?.trim();
      return result === 'not_found' ? null : result;
    } catch (error) {
      console.error('Data extraction error:', error);
      return null;
    }
  }
}; 