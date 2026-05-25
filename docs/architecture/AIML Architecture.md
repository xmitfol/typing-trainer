**🤖**** AI/ML Architecture**
**Typing**** ****Trainer**** ****SaaS**** - Система искусственного интеллекта**
**Версия:** 1.0
**Дата:** 09 октября 2025
**Связанные документы:** , 

**📋**** Содержание**








**🎯**** AI Strategy**
**Vision**
Создать **персонального AI-тренера**, который:
📊 Анализирует паттерны печати в реальном времени
🎯 Предсказывает проблемные зоны
💡 Генерирует персональные упражнения
🗣️ Общается с пользователем естественным языком
📈 Адаптирует сложность динамически
**AI-****Driven**** ****Features**
Level 1 (MVP)        Level 2              Level 3
────────────────────────────────────────────────────
Local Analytics  →  ML Predictions   →  Full LLM
Simple rules        Pattern matching    Conversational AI
Browser-based       Backend ML          OpenAI/Claude API
$0 cost            $50-100/mo          $500-1000/mo

**🏗****️**** ****Уровни**** AI ****интеграции**
**Level 1: Rule-Based Analytics (MVP)**
**Технологии:** Pure JavaScript, Browser-based
**Стоимость:** $0
**Сроки:** Месяц 1-3
**Возможности****:**
class SimpleAnalyzer {
  // 1. Weak Keys Detection
  findWeakKeys(keystrokes) {
    const stats = {};

    keystrokes.forEach(k => {
      if (!stats[k.expected]) {
        stats[k.expected] = { total: 0, errors: 0, latencies: [] };
      }
      stats[k.expected].total++;
      if (!k.correct) stats[k.expected].errors++;
      stats[k.expected].latencies.push(k.latency);
    });

    const weakKeys = Object.entries(stats)
      .filter(([key, data]) => {
        const errorRate = (data.errors / data.total) * 100;
        const avgLatency = data.latencies.reduce((a,b) => a+b) / data.latencies.length;
        return errorRate > 15 || avgLatency > 400;
      })
      .map(([key, data]) => ({
        key,
        errorRate: (data.errors / data.total) * 100,
        avgLatency: data.latencies.reduce((a,b) => a+b) / data.latencies.length
      }));

    return weakKeys.slice(0, 3); // Top 3
  }

  // 2. Speed Plateau Detection
  detectPlateau(sessions) {
    const recent = sessions.slice(-10);
    const avgWPM = recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length;
    const stdDev = this.calculateStdDev(recent.map(s => s.wpm));

    return {
      isPlateau: stdDev < 5 && sessions.length >= 10,
      avgWPM,
      recommendation: stdDev < 5 ? 'Try burst training exercises' : null
    };
  }

  // 3. Weak Fingers Detection
  findWeakFingers(keystrokes) {
    const fingerMap = {
      'a': 'pinky_left', 's': 'ring_left', 'd': 'middle_left',
      'f': 'index_left', 'j': 'index_right', 'k': 'middle_right',
      // ... complete mapping
    };

    const fingerStats = {};

    keystrokes.forEach(k => {
      const finger = fingerMap[k.expected];
      if (!finger) return;

      if (!fingerStats[finger]) {
        fingerStats[finger] = { total: 0, errors: 0 };
      }
      fingerStats[finger].total++;
      if (!k.correct) fingerStats[finger].errors++;
    });

    const weakFingers = Object.entries(fingerStats)
      .map(([finger, data]) => ({
        finger,
        errorRate: (data.errors / data.total) * 100
      }))
      .filter(f => f.errorRate > 12)
      .sort((a, b) => b.errorRate - a.errorRate);

    return weakFingers;
  }
}
**Recommendations Engine:**
class RecommendationEngine {
  generateRecommendations(analysis) {
    const recommendations = [];

    // Weak keys
    if (analysis.weakKeys.length > 0) {
      recommendations.push({
        type: 'weak_keys',
        priority: 'high',
        title: `Practice these keys: ${analysis.weakKeys.map(k => k.key).join(', ')}`,
        action: 'custom_drill',
        data: { keys: analysis.weakKeys.map(k => k.key) }
      });
    }

    // Plateau
    if (analysis.plateau.isPlateau) {
      recommendations.push({
        type: 'plateau',
        priority: 'medium',
        title: 'Your speed has plateaued',
        description: 'Try burst training to break through',
        action: 'speed_burst',
        data: { currentWPM: analysis.plateau.avgWPM }
      });
    }

    // Weak fingers
    if (analysis.weakFingers.length > 0) {
      const finger = analysis.weakFingers[0];
      recommendations.push({
        type: 'weak_finger',
        priority: 'medium',
        title: `${finger.finger} needs practice`,
        description: `${finger.errorRate.toFixed(1)}% error rate`,
        action: 'finger_drill',
        data: { finger: finger.finger }
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }
}

**Level 2: Machine Learning (v2.0)**
**Технологии****:** Python, scikit-learn, FastAPI
**Стоимость****:** $50-100/месяц
**Сроки****:** Месяц 6-7
**Architecture**
┌─────────────────────────────────────┐
│         Frontend                    │
│  Collects keystroke data            │
└───────────┬─────────────────────────┘
            │ POST /api/analyze
            ▼
┌─────────────────────────────────────┐
│       FastAPI Backend               │
│  ┌──────────────────────────────┐  │
│  │  Analysis Service            │  │
│  │  - Feature extraction        │  │
│  │  - Model inference           │  │
│  └───────────┬──────────────────┘  │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       ML Service                    │
│  ┌──────────────────────────────┐  │
│  │  Pattern Classifier          │  │
│  │  (scikit-learn)              │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Difficulty Predictor        │  │
│  │  (XGBoost)                   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Exercise Generator          │  │
│  │  (Rule-based + ML)           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     PostgreSQL + Redis              │
│  - Training data                    │
│  - Model cache                      │
└─────────────────────────────────────┘
**ML Models**
**1. Pattern Classifier**
# ml/models/pattern_classifier.py
from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import numpy as np

class TypingPatternClassifier:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )

    def extract_features(self, keystrokes_df):
        """Extract features from keystroke data"""
        features = {}

        # Basic stats
        features['avg_latency'] = keystrokes_df['latency'].mean()
        features['std_latency'] = keystrokes_df['latency'].std()
        features['error_rate'] = (
            (~keystrokes_df['correct']).sum() / len(keystrokes_df)
        )

        # Key-specific stats
        for key in 'abcdefghijklmnopqrstuvwxyz':
            key_df = keystrokes_df[keystrokes_df['expected'] == key]
            if len(key_df) > 0:
                features[f'key_{key}_error'] = (~key_df['correct']).mean()
                features[f'key_{key}_latency'] = key_df['latency'].mean()

        # Bigram stats
        bigrams = []
        for i in range(len(keystrokes_df) - 1):
            bigram = keystrokes_df.iloc[i]['expected'] + keystrokes_df.iloc[i+1]['expected']
            bigrams.append(bigram)

        # Most common bigrams
        from collections import Counter
        bigram_counts = Counter(bigrams)
        for bigram, count in bigram_counts.most_common(10):
            features[f'bigram_{bigram}_freq'] = count / len(bigrams)

        return pd.Series(features)

    def train(self, training_data):
        """Train classifier on labeled data"""
        X = training_data.drop('pattern_type', axis=1)
        y = training_data['pattern_type']

        self.model.fit(X, y)

    def predict(self, keystrokes_df):
        """Predict typing pattern"""
        features = self.extract_features(keystrokes_df).to_frame().T
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]

        return {
            'pattern': prediction,
            'confidence': float(max(probabilities)),
            'patterns': {
                'weak_keys': probabilities[0],
                'weak_fingers': probabilities[1],
                'speed_inconsistent': probabilities[2],
                'normal': probabilities[3]
            }
        }
**2. Difficulty Adapter**
# ml/models/difficulty_adapter.py
import xgboost as xgb
from sklearn.preprocessing import StandardScaler

class DifficultyAdapter:
    def __init__(self):
        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6
        )
        self.scaler = StandardScaler()

    def extract_user_features(self, user_id, db):
        """Extract user performance features"""
        # Recent sessions
        sessions = db.query(Session).filter(
            Session.user_id == user_id
        ).order_by(Session.created_at.desc()).limit(20).all()

        if not sessions:
            return None

        features = {
            'avg_wpm': np.mean([s.wpm for s in sessions]),
            'std_wpm': np.std([s.wpm for s in sessions]),
            'avg_accuracy': np.mean([s.accuracy for s in sessions]),
            'total_sessions': len(sessions),
            'avg_errors': np.mean([s.errors for s in sessions]),
            'improvement_rate': self._calculate_improvement(sessions),
            'consistency_score': self._calculate_consistency(sessions)
        }

        return features

    def predict_optimal_difficulty(self, user_features, lesson_base_difficulty):
        """Predict optimal difficulty adjustment"""
        if user_features is None:
            return lesson_base_difficulty

        features_array = np.array(list(user_features.values())).reshape(1, -1)
        features_scaled = self.scaler.transform(features_array)

        adjustment = self.model.predict(features_scaled)[0]

        # Adjust base difficulty
        optimal_difficulty = max(1, min(5, lesson_base_difficulty + adjustment))

        return {
            'base_difficulty': lesson_base_difficulty,
            'adjustment': float(adjustment),
            'optimal_difficulty': int(round(optimal_difficulty)),
            'reasoning': self._explain_adjustment(adjustment)
        }

    def _explain_adjustment(self, adjustment):
        if adjustment > 0.5:
            return "Performance is strong - increasing challenge"
        elif adjustment < -0.5:
            return "Struggling with current level - simplifying"
        else:
            return "Maintaining current difficulty"
**3. Exercise Generator (ML-Enhanced)**
# ml/models/exercise_generator.py
from collections import Counter
import random

class AdaptiveExerciseGenerator:
    def __init__(self):
        self.word_corpus = self._load_word_corpus()

    def generate_drill(self, weak_keys, difficulty='medium'):
        """Generate targeted drill exercise"""
        exercises = []

        # Level 1: Individual keys
        for key in weak_keys[:3]:
            exercises.append(f"{key * 3} ")

        # Level 2: Key combinations
        for i, key1 in enumerate(weak_keys):
            for key2 in weak_keys[i+1:]:
                exercises.append(f"{key1}{key2} {key2}{key1} ")

        # Level 3: Words containing weak keys
        words = self._find_words_with_keys(weak_keys, min_occurrences=2)
        exercises.append(" ".join(random.sample(words, min(10, len(words)))))

        return "\n".join(exercises)

    def generate_natural_text(self, weak_keys, length=100):
        """Generate natural-sounding text focusing on weak keys"""
        sentences = []
        words_used = 0

        while words_used < length:
            # Find sentence templates
            template_words = self._find_words_with_keys(weak_keys, min_occurrences=1)

            # Build sentence (simple markov chain)
            sentence = self._build_sentence(template_words, max_words=15)
            sentences.append(sentence)
            words_used += len(sentence.split())

        return " ".join(sentences)

    def _find_words_with_keys(self, keys, min_occurrences=1):
        """Find words containing target keys"""
        matching_words = []

        for word in self.word_corpus:
            key_count = sum(1 for key in keys if key in word.lower())
            if key_count >= min_occurrences:
                matching_words.append(word)

        return matching_words[:100]  # Limit

    def _build_sentence(self, word_pool, max_words=15):
        """Build grammatically acceptable sentence"""
        # Simplified - in production use proper NLP
        sentence = []

        # Start with article or pronoun
        sentence.append(random.choice(['The', 'A', 'This', 'That']))

        # Add words from pool
        sentence.extend(random.sample(word_pool, min(max_words - 2, len(word_pool))))

        # End with period
        sentence[-1] = sentence[-1] + '.'

        return " ".join(sentence)

**Level 3: LLM ****Integration**** (v3.0)**
**Технологии:** OpenAI GPT-4 / Anthropic Claude
**Стоимость:** $500-1000/месяц
**Сроки:** Месяц 8-10
**Architecture**
┌─────────────────────────────────────┐
│         Frontend                    │
│  User chat interface                │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│       AI Service API                │
│  ┌──────────────────────────────┐  │
│  │  Prompt Engineering          │  │
│  │  - System prompts            │  │
│  │  - Context injection         │  │
│  │  - Safety filters            │  │
│  └───────────┬──────────────────┘  │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     LLM API (OpenAI/Anthropic)      │
│  ┌──────────────────────────────┐  │
│  │  GPT-4 / Claude              │  │
│  │  - Text generation           │  │
│  │  - Analysis                  │  │
│  │  - Recommendations           │  │
│  └──────────────────────────────┘  │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│     Vector Database (Pinecone)      │
│  - Conversation history             │
│  - User context embeddings          │
│  - Exercise templates               │
└─────────────────────────────────────┘
**LLM Service Implementation**
# services/llm_service.py
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import json

class LLMService:
    def __init__(self, provider='openai'):
        self.provider = provider

        if provider == 'openai':
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4-turbo-preview"
        elif provider == 'anthropic':
            self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = "claude-3-opus-20240229"

    async def analyze_performance(self, user_data):
        """Deep analysis of user performance"""

        # Prepare context
        context = self._build_performance_context(user_data)

        # System prompt
        system_prompt = """You are an expert typing coach with deep knowledge of:
- Motor learning and muscle memory
- Common typing challenges and solutions
- Progressive skill development
- Motivational psychology

Analyze the user's typing performance and provide:
1. Clear insights about strengths and weaknesses
2. Specific, actionable recommendations
3. Encouragement and motivation
4. Realistic timeline for improvement

Be concise, supportive, and practical."""

        # User prompt
        user_prompt = f"""Analyze this typing performance data:

{json.dumps(context, indent=2)}

Provide a comprehensive analysis with:
1. Key observations (2-3 bullet points)
2. Main challenges (1-2 specific issues)
3. Recommendations (3-4 actionable steps)
4. Expected timeline for reaching 100 WPM"""

        # Call LLM
        if self.provider == 'openai':
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            analysis = response.choices[0].message.content

        elif self.provider == 'anthropic':
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=800,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            analysis = response.content[0].text

        # Parse and structure response
        return self._parse_analysis(analysis)

    async def generate_custom_text(
        self,
        focus_keys,
        difficulty,
        length=100,
        style='general'
    ):
        """Generate personalized typing exercise"""

        prompt = f"""Generate a {length}-word typing practice text with these requirements:

Focus Keys: {', '.join(focus_keys)}
- Include these keys frequently but naturally
- Use in common word combinations

Difficulty: {difficulty}
Style: {style}

Requirements:
- Natural, flowing sentences (not random words)
- Appropriate complexity for level
- Engaging content
- NO explicit mentions of typing or practice
- Use proper grammar and punctuation

Generate ONLY the practice text, no explanations."""

        if self.provider == 'openai':
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a creative writer generating typing practice texts."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,  # Higher for creativity
                max_tokens=500
            )
            text = response.choices[0].message.content

        # Validate and clean
        text = self._validate_generated_text(text, focus_keys)

        return {
            'text': text,
            'word_count': len(text.split()),
            'focus_keys': focus_keys,
            'key_distribution': self._analyze_key_distribution(text, focus_keys)
        }

    async def chat_with_coach(self, user_id, message, conversation_history):
        """Conversational AI coach"""

        # Get user context
        user_context = await self._get_user_context(user_id)

        # Build messages
        messages = [
            {
                "role": "system",
                "content": f"""You are a supportive, expert typing coach having a conversation with a student.

User Context:
- Current WPM: {user_context['wpm']}
- Accuracy: {user_context['accuracy']}%
- Lessons completed: {user_context['lessons_completed']}
- Weak keys: {', '.join(user_context['weak_keys'])}

Be:
- Encouraging and positive
- Specific and actionable
- Empathetic to frustrations
- Brief (2-3 sentences max)

Never:
- Be discouraging
- Give generic advice
- Ignore their specific data"""
            }
        ]

        # Add conversation history
        messages.extend(conversation_history[-10:])  # Last 10 messages

        # Add current message
        messages.append({"role": "user", "content": message})

        # Get response
        if self.provider == 'openai':
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,
                max_tokens=200
            )
            reply = response.choices[0].message.content

        return {
            'message': reply,
            'suggestions': self._extract_suggestions(reply),
            'sentiment': 'positive'  # Could use sentiment analysis
        }

    def _build_performance_context(self, user_data):
        """Structure user data for LLM"""
        return {
            'current_stats': {
                'wpm': user_data['current_wpm'],
                'accuracy': user_data['accuracy'],
                'practice_time': user_data['total_minutes']
            },
            'progress': {
                'starting_wpm': user_data['starting_wpm'],
                'improvement': user_data['current_wpm'] - user_data['starting_wpm'],
                'weeks_practicing': user_data['weeks']
            },
            'challenges': {
                'weak_keys': user_data['weak_keys'],
                'error_patterns': user_data['common_errors'],
                'plateau': user_data.get('plateau', False)
            }
        }
**Cost Management**
# services/llm_cost_manager.py
class LLMCostManager:
    def __init__(self):
        self.token_costs = {
            'gpt-4-turbo': {'input': 0.01 / 1000, 'output': 0.03 / 1000},
            'gpt-3.5-turbo': {'input': 0.0005 / 1000, 'output': 0.0015 / 1000},
            'claude-3-opus': {'input': 0.015 / 1000, 'output': 0.075 / 1000}
        }

    async def track_usage(self, user_id, model, input_tokens, output_tokens):
        """Track and store LLM usage"""
        cost = (
            input_tokens * self.token_costs[model]['input'] +
            output_tokens * self.token_costs[model]['output']
        )

        # Store in database
        await db.execute(
            """INSERT INTO llm_usage 
               (user_id, model, input_tokens, output_tokens, cost, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())""",
            user_id, model, input_tokens, output_tokens, cost
        )

        return cost

    async def check_user_quota(self, user_id):
        """Check if user has remaining quota"""
        # Free users: 10 AI requests/day
        # Premium: 100 requests/day
        # Professional: unlimited

        user = await get_user(user_id)

        if user.is_professional:
            return True, float('inf')

        limit = 100 if user.is_premium else 10

        today_usage = await db.fetch_one(
            """SELECT COUNT(*) as count FROM llm_usage
               WHERE user_id = $1 AND created_at >= CURRENT_DATE""",
            user_id
        )

        remaining = limit - today_usage['count']

        return remaining > 0, remaining

**📊**** Performance Metrics**
**Model Performance Targets**
**Cost ****Estimates**
**Per**** 1000 ****users****/****month****:**
**Optimization**** ****strategies****:**
Cache LLM responses for similar queries
Use GPT-3.5 for simple tasks, GPT-4 for complex
Batch analyze requests
Implement rate limiting

**Статус:** ✅ Готово к реализации
**Все архитектурные документы созданы!**
**Дата:** 09 октября 2025


| Model | Metric | Target |
| --- | --- | --- |
| Pattern Classifier | Accuracy | >85% |
| Difficulty Adapter | MAE | <0.5 difficulty units |
| Exercise Generator | User Rating | >4.0/5 |
| LLM Analysis | Relevance Score | >4.5/5 |


| Level | Feature | Monthly Cost |
| --- | --- | --- |
| Level 1 | Local Analytics | $0 |
| Level 2 | ML Models | $50-100 |
| Level 3 | LLM (avg 50 req/user) | $500-1000 |
