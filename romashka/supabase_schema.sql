-- ROMASHKA Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB
);

-- Create conversations table with AI enhancements
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  agent_id UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  tags TEXT[],
  satisfaction_score DECIMAL(3,2),
  -- AI enhancements
  language VARCHAR(10) DEFAULT 'en',
  sentiment VARCHAR(20),
  intent VARCHAR(100),
  ai_confidence DECIMAL(3,2),
  business_context JSONB
);

-- Create messages table with AI enhancements
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  -- AI enhancements
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  intent_detected VARCHAR(100),
  knowledge_sources JSONB,
  tokens_used INTEGER
);

-- Create knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0
);

-- Create knowledge categories table
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_categories(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge items table
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES knowledge_categories(id),
  source_type VARCHAR(50) NOT NULL, -- 'url', 'file', 'manual'
  source_url TEXT,
  file_path TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  language VARCHAR(10) DEFAULT 'en',
  tags TEXT[], -- Array of tags
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived'
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge versions table
CREATE TABLE IF NOT EXISTS knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id),
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create knowledge analytics table
CREATE TABLE IF NOT EXISTS knowledge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID REFERENCES knowledge_items(id),
  conversation_id UUID REFERENCES conversations(id),
  was_helpful BOOLEAN,
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create intent patterns table
CREATE TABLE IF NOT EXISTS intent_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent_name VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  patterns TEXT[] NOT NULL,
  examples JSONB,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create conversation context table
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) UNIQUE,
  context_data JSONB NOT NULL,
  last_intent VARCHAR(100),
  conversation_summary TEXT,
  key_entities JSONB,
  customer_preferences JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  conversation_id UUID REFERENCES conversations(id),
  status VARCHAR(50) DEFAULT 'running',
  current_step INTEGER DEFAULT 0,
  execution_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_intent_patterns_language ON intent_patterns(language);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_item_id ON knowledge_analytics(knowledge_item_id);

-- Insert some default intent patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'en', ARRAY['price', 'cost', 'how much', 'pricing', 'plan'], '{"examples": ["How much does it cost?", "What are your pricing plans?"]}'),
('product_info', 'en', ARRAY['product', 'feature', 'specification', 'what is', 'tell me about'], '{"examples": ["Tell me about your product", "What features do you have?"]}'),
('support_request', 'en', ARRAY['help', 'problem', 'issue', 'broken', 'not working'], '{"examples": ["I need help", "There is a problem"]}'),
('order_status', 'en', ARRAY['order', 'shipping', 'delivery', 'track', 'status'], '{"examples": ["Where is my order?", "Track my delivery"]}'),
('return_refund', 'en', ARRAY['return', 'refund', 'exchange', 'money back'], '{"examples": ["I want to return this", "Can I get a refund?"]}'),
('billing_question', 'en', ARRAY['bill', 'payment', 'invoice', 'charge'], '{"examples": ["I have a billing question", "Payment issue"]}'),
('general_inquiry', 'en', ARRAY['question', 'information', 'general'], '{"examples": ["I have a question", "General information"]}'),
('booking_appointment', 'en', ARRAY['schedule', 'appointment', 'meeting', 'demo'], '{"examples": ["I want to schedule", "Book an appointment"]}'),
('complaint', 'en', ARRAY['complaint', 'unhappy', 'dissatisfied', 'bad'], '{"examples": ["I am unhappy", "I have a complaint"]}'),
('compliment', 'en', ARRAY['great', 'amazing', 'love', 'excellent'], '{"examples": ["This is great", "I love your service"]}');

-- Insert Spanish patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'es', ARRAY['precio', 'costo', 'cuánto cuesta', 'planes'], '{"examples": ["¿Cuánto cuesta?", "¿Cuáles son sus planes de precios?"]}'),
('product_info', 'es', ARRAY['producto', 'característica', 'especificación'], '{"examples": ["Hábleme de su producto", "¿Qué características tienen?"]}'),
('support_request', 'es', ARRAY['ayuda', 'problema', 'no funciona'], '{"examples": ["Necesito ayuda", "Hay un problema"]}'),
('return_refund', 'es', ARRAY['devolución', 'reembolso', 'cambio'], '{"examples": ["Quiero devolver esto", "¿Puedo obtener un reembolso?"]}');

-- Insert French patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'fr', ARRAY['prix', 'coût', 'combien coûte'], '{"examples": ["Combien ça coûte?", "Quels sont vos tarifs?"]}'),
('product_info', 'fr', ARRAY['produit', 'fonctionnalité', 'spécification'], '{"examples": ["Parlez-moi de votre produit", "Quelles fonctionnalités avez-vous?"]}'),
('support_request', 'fr', ARRAY['aide', 'problème', 'ne fonctionne pas'], '{"examples": ["J\'ai besoin d\'aide", "Il y a un problème"]}'),
('return_refund', 'fr', ARRAY['retour', 'remboursement', 'échange'], '{"examples": ["Je veux retourner ceci", "Puis-je obtenir un remboursement?"]}');

-- Insert German patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'de', ARRAY['preis', 'kosten', 'wie viel'], '{"examples": ["Wie viel kostet es?", "Was sind Ihre Preise?"]}'),
('product_info', 'de', ARRAY['produkt', 'funktion', 'spezifikation'], '{"examples": ["Erzählen Sie mir von Ihrem Produkt", "Welche Funktionen haben Sie?"]}'),
('support_request', 'de', ARRAY['hilfe', 'problem', 'funktioniert nicht'], '{"examples": ["Ich brauche Hilfe", "Es gibt ein Problem"]}'),
('return_refund', 'de', ARRAY['rückgabe', 'erstattung', 'austausch'], '{"examples": ["Ich möchte das zurückgeben", "Kann ich eine Erstattung erhalten?"]}');

-- Insert Italian patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'it', ARRAY['prezzo', 'costo', 'quanto costa'], '{"examples": ["Quanto costa?", "Quali sono i vostri prezzi?"]}'),
('product_info', 'it', ARRAY['prodotto', 'caratteristica', 'specifica'], '{"examples": ["Parlatemi del vostro prodotto", "Quali caratteristiche avete?"]}'),
('support_request', 'it', ARRAY['aiuto', 'problema', 'non funziona'], '{"examples": ["Ho bisogno di aiuto", "C\'è un problema"]}'),
('return_refund', 'it', ARRAY['restituzione', 'rimborso', 'cambio'], '{"examples": ["Voglio restituire questo", "Posso ottenere un rimborso?"]}');

-- Insert Portuguese patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'pt', ARRAY['preço', 'custo', 'quanto custa'], '{"examples": ["Quanto custa?", "Quais são seus preços?"]}'),
('product_info', 'pt', ARRAY['produto', 'característica', 'especificação'], '{"examples": ["Fale-me sobre seu produto", "Quais características vocês têm?"]}'),
('support_request', 'pt', ARRAY['ajuda', 'problema', 'não funciona'], '{"examples": ["Preciso de ajuda", "Há um problema"]}'),
('return_refund', 'pt', ARRAY['devolução', 'reembolso', 'troca'], '{"examples": ["Quero devolver isso", "Posso obter um reembolso?"]}');

-- Insert Dutch patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'nl', ARRAY['prijs', 'kosten', 'hoeveel kost'], '{"examples": ["Hoeveel kost het?", "Wat zijn uw prijzen?"]}'),
('product_info', 'nl', ARRAY['product', 'functie', 'specificatie'], '{"examples": ["Vertel me over uw product", "Welke functies heeft u?"]}'),
('support_request', 'nl', ARRAY['hulp', 'probleem', 'werkt niet'], '{"examples": ["Ik heb hulp nodig", "Er is een probleem"]}'),
('return_refund', 'nl', ARRAY['terugkeer', 'terugbetaling', 'ruil'], '{"examples": ["Ik wil dit teruggeven", "Kan ik een terugbetaling krijgen?"]}');

-- Insert Russian patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'ru', ARRAY['цена', 'стоимость', 'сколько стоит'], '{"examples": ["Сколько это стоит?", "Какие у вас цены?"]}'),
('product_info', 'ru', ARRAY['продукт', 'функция', 'спецификация'], '{"examples": ["Расскажите о вашем продукте", "Какие функции у вас есть?"]}'),
('support_request', 'ru', ARRAY['помощь', 'проблема', 'не работает'], '{"examples": ["Мне нужна помощь", "Есть проблема"]}'),
('return_refund', 'ru', ARRAY['возврат', 'возмещение', 'обмен'], '{"examples": ["Я хочу вернуть это", "Могу ли я получить возмещение?"]}');

-- Insert Japanese patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'ja', ARRAY['価格', '料金', 'いくら'], '{"examples": ["いくらですか？", "料金プランは？"]}'),
('product_info', 'ja', ARRAY['製品', '機能', '仕様'], '{"examples": ["製品について教えて", "どのような機能がありますか？"]}'),
('support_request', 'ja', ARRAY['ヘルプ', '問題', '動作しない'], '{"examples": ["助けてください", "問題があります"]}'),
('return_refund', 'ja', ARRAY['返品', '返金', '交換'], '{"examples": ["これを返品したい", "返金してもらえますか？"]}');

-- Insert Chinese patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'zh', ARRAY['价格', '费用', '多少钱'], '{"examples": ["多少钱？", "你们的定价方案是什么？"]}'),
('product_info', 'zh', ARRAY['产品', '功能', '规格'], '{"examples": ["告诉我关于你们的产品", "你们有什么功能？"]}'),
('support_request', 'zh', ARRAY['帮助', '问题', '不工作'], '{"examples": ["我需要帮助", "有问题"]}'),
('return_refund', 'zh', ARRAY['退货', '退款', '换货'], '{"examples": ["我想退货", "我能获得退款吗？"]}');

-- Insert Korean patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'ko', ARRAY['가격', '비용', '얼마'], '{"examples": ["얼마입니까?", "가격 플랜은 무엇입니까?"]}'),
('product_info', 'ko', ARRAY['제품', '기능', '사양'], '{"examples": ["제품에 대해 알려주세요", "어떤 기능이 있습니까?"]}'),
('support_request', 'ko', ARRAY['도움', '문제', '작동하지 않음'], '{"examples": ["도움이 필요합니다", "문제가 있습니다"]}'),
('return_refund', 'ko', ARRAY['반품', '환불', '교환'], '{"examples": ["이것을 반품하고 싶습니다", "환불을 받을 수 있습니까?"]}');

-- Insert Arabic patterns
INSERT INTO intent_patterns (intent_name, language, patterns, examples) VALUES
('pricing_inquiry', 'ar', ARRAY['سعر', 'تكلفة', 'كم يكلف'], '{"examples": ["كم يكلف؟", "ما هي خطط التسعير؟"]}'),
('product_info', 'ar', ARRAY['منتج', 'ميزة', 'مواصفات'], '{"examples": ["أخبرني عن منتجك", "ما هي الميزات التي لديك؟"]}'),
('support_request', 'ar', ARRAY['مساعدة', 'مشكلة', 'لا يعمل'], '{"examples": ["أحتاج مساعدة", "هناك مشكلة"]}'),
('return_refund', 'ar', ARRAY['إرجاع', 'استرداد', 'تبديل'], '{"examples": ["أريد إرجاع هذا", "هل يمكنني الحصول على استرداد؟"]}'); 