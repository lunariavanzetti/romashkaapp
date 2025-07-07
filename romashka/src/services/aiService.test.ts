import { describe, test, expect } from 'vitest';
import { AIService } from './aiService';
import type { KnowledgeBase } from '../types/supabase';

const mockKnowledgeBase: KnowledgeBase[] = [
  {
    id: '1',
    project_id: 'proj1',
    title: 'Business Hours',
    content: 'Our business hours are 9am-5pm.',
    source_type: 'manual',
    source_url: null,
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

describe('AI Service', () => {
  test('generates appropriate responses', async () => {
    const aiService = new AIService();
    const response = await aiService.generateResponse(
      'What are your business hours?',
      mockKnowledgeBase
    );
    expect(response).toContain('business hours');
  });
}); 