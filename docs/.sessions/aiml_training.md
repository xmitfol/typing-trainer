# 🤖 AI/ML Agent - Training Summary

**Книга:** "Соло на пишущей машинке" В.В. Шахиджанян (1992)
**Дата:** 2025-11-19
**Координатор:** Клод

---

## 🎯 Цель обучения

Изучить **персонализацию и адаптивность** в обучении слепой печати для создания AI-driven features.

---

## 🔑 TOP-12 AI/ML Insights

### 1. **Weak Keys Detection - персональная диагностика**

**Концепция из книги:**
> "У каждого ученика есть 3-5 'слабых' клавиш, которые вызывают больше всего ошибок. Найдите их и тренируйте отдельно."

**ML подход:**

```python
# Track errors per key
class WeakKeysDetector:
    def __init__(self):
        self.error_counts = defaultdict(int)
        self.total_attempts = defaultdict(int)

    def record_keystroke(self, key, is_error):
        self.total_attempts[key] += 1
        if is_error:
            self.error_counts[key] += 1

    def detect_weak_keys(self, threshold=0.15):
        """
        Detect keys with error rate > threshold
        """
        weak_keys = []

        for key in self.error_counts:
            if self.total_attempts[key] < 10:
                continue  # Not enough data

            error_rate = self.error_counts[key] / self.total_attempts[key]

            if error_rate > threshold:
                weak_keys.append({
                    'key': key,
                    'error_rate': error_rate,
                    'error_count': self.error_counts[key],
                    'severity': self._get_severity(error_rate)
                })

        return sorted(weak_keys, key=lambda x: x['error_rate'], reverse=True)

    def _get_severity(self, error_rate):
        if error_rate > 0.3:
            return 'critical'
        elif error_rate > 0.2:
            return 'high'
        else:
            return 'medium'
```

**Персональные drills:**

```python
def generate_personalized_drill(weak_keys, length=100):
    """
    Generate text with higher frequency of weak keys
    """
    # Base vocabulary
    words = load_russian_words()

    # Filter words containing weak keys
    weak_key_chars = [wk['key'] for wk in weak_keys[:3]]
    targeted_words = [w for w in words if any(c in w for c in weak_key_chars)]

    # Generate text (70% targeted, 30% normal)
    drill_text = []
    for i in range(length):
        if random.random() < 0.7:
            drill_text.append(random.choice(targeted_words))
        else:
            drill_text.append(random.choice(words))

    return ' '.join(drill_text)
```

**Metrics:**
```python
metrics = {
    'weak_keys_count': len(weak_keys),
    'avg_error_rate': np.mean([wk['error_rate'] for wk in weak_keys]),
    'improvement_rate': calculate_improvement_over_time(),
    'drills_completed': user.drills_count
}
```

---

### 2. **Skill Level Classification - 3 уровня мастерства**

**Из книги: Идеомоторная печать**

**Level 1: Conscious (Сознательный)**
- Признаки: WPM < 30, смотрит на клавиатуру, долгие паузы между нажатиями

**Level 2: Automatic (Автоматический)**
- Признаки: WPM 30-60, не смотрит на клавиатуру, равномерный ритм

**Level 3: Ideomotor (Идеомоторный)**
- Признаки: WPM 60+, быстрые интервалы между клавишами, думает о словах

**ML Classification:**

```python
class SkillLevelClassifier:
    def __init__(self):
        self.features = [
            'wpm',
            'avg_keystroke_interval',
            'keystroke_variance',
            'error_rate',
            'look_at_keyboard_ratio',  # If eye tracking available
            'pause_frequency'
        ]

    def extract_features(self, session_data):
        """
        Extract features from typing session
        """
        keystrokes = session_data['keystrokes']
        intervals = np.diff([k['timestamp'] for k in keystrokes])

        return {
            'wpm': self.calculate_wpm(session_data),
            'avg_keystroke_interval': np.mean(intervals),
            'keystroke_variance': np.std(intervals) / np.mean(intervals),
            'error_rate': session_data['errors'] / len(keystrokes),
            'look_at_keyboard_ratio': self.get_look_ratio(session_data),
            'pause_frequency': len([i for i in intervals if i > 1000]) / len(intervals)
        }

    def classify(self, features):
        """
        Rule-based classification (can be replaced with ML model)
        """
        wpm = features['wpm']
        interval = features['avg_keystroke_interval']
        variance = features['keystroke_variance']
        look_ratio = features['look_at_keyboard_ratio']

        # Level 1: Conscious
        if wpm < 30 or look_ratio > 0.3 or interval > 300:
            return {
                'level': 'conscious',
                'confidence': 0.9,
                'next_goal': 'Не смотри на клавиатуру',
                'estimated_lessons': 10
            }

        # Level 2: Automatic
        if 30 <= wpm < 60 and look_ratio < 0.1 and variance < 0.5:
            return {
                'level': 'automatic',
                'confidence': 0.85,
                'next_goal': 'Думай о словах, не о буквах',
                'estimated_lessons': 20
            }

        # Level 3: Ideomotor
        if wpm >= 60 and interval < 150 and variance < 0.3:
            return {
                'level': 'ideomotor',
                'confidence': 0.95,
                'next_goal': 'Профессиональные треки',
                'estimated_lessons': 0  # Already mastered!
            }

        # Default
        return {'level': 'automatic', 'confidence': 0.5}
```

---

### 3. **Adaptive Difficulty - динамическая сложность**

**Из книги:**
> "Если ученик делает > 5 ошибок на 100 символов - урок слишком сложный. Вернитесь к предыдущему."

**ML approach:**

```python
class AdaptiveDifficultyEngine:
    def __init__(self):
        self.difficulty_threshold = {
            'too_easy': {'error_rate': 0.01, 'wpm_growth': 0.2},
            'optimal': {'error_rate': 0.05, 'wpm_growth': 0.1},
            'too_hard': {'error_rate': 0.1, 'wpm_growth': -0.05}
        }

    def recommend_next_lesson(self, user_history):
        """
        Recommend next lesson based on performance
        """
        last_3_lessons = user_history[-3:]

        avg_error_rate = np.mean([l['error_rate'] for l in last_3_lessons])
        wpm_growth = self.calculate_wpm_growth(last_3_lessons)

        # Too hard - repeat or go back
        if avg_error_rate > 0.1 or wpm_growth < -0.05:
            return {
                'action': 'repeat',
                'lesson_id': user_history[-1]['lesson_id'],
                'reason': 'Слишком много ошибок - закрепи навык',
                'suggestion': 'Попробуй печатать медленнее'
            }

        # Too easy - skip or accelerate
        if avg_error_rate < 0.01 and wpm_growth > 0.2:
            return {
                'action': 'skip',
                'lesson_id': user_history[-1]['lesson_id'] + 2,
                'reason': 'Ты быстро прогрессируешь!',
                'suggestion': 'Попробуй более сложный урок'
            }

        # Optimal - continue
        return {
            'action': 'continue',
            'lesson_id': user_history[-1]['lesson_id'] + 1,
            'reason': 'Отличный темп!',
            'suggestion': 'Продолжай в том же духе'
        }

    def calculate_wpm_growth(self, lessons):
        if len(lessons) < 2:
            return 0
        first_wpm = lessons[0]['wpm']
        last_wpm = lessons[-1]['wpm']
        return (last_wpm - first_wpm) / first_wpm if first_wpm > 0 else 0
```

---

### 4. **Keystroke Dynamics - биометрический анализ**

**Концепция:**
Каждый человек печатает с уникальным ритмом. ML может выявить паттерны и аномалии.

**Features to extract:**

```python
class KeystrokeDynamicsAnalyzer:
    def __init__(self):
        self.features = []

    def extract_timing_features(self, keystrokes):
        """
        Extract temporal features from keystroke sequence
        """
        # Dwell time (key press duration)
        dwell_times = [k['release_time'] - k['press_time'] for k in keystrokes]

        # Flight time (interval between keys)
        flight_times = []
        for i in range(len(keystrokes) - 1):
            flight_times.append(
                keystrokes[i+1]['press_time'] - keystrokes[i]['release_time']
            )

        # Digraph latency (time between specific key pairs)
        digraph_latency = {}
        for i in range(len(keystrokes) - 1):
            pair = keystrokes[i]['key'] + keystrokes[i+1]['key']
            latency = keystrokes[i+1]['press_time'] - keystrokes[i]['press_time']
            if pair not in digraph_latency:
                digraph_latency[pair] = []
            digraph_latency[pair].append(latency)

        return {
            'avg_dwell_time': np.mean(dwell_times),
            'std_dwell_time': np.std(dwell_times),
            'avg_flight_time': np.mean(flight_times),
            'std_flight_time': np.std(flight_times),
            'rhythm_consistency': 1 / (1 + np.std(flight_times)),
            'digraph_latency': {k: np.mean(v) for k, v in digraph_latency.items()}
        }

    def detect_struggling_patterns(self, features):
        """
        Detect if user is struggling based on keystroke dynamics
        """
        # High variance in flight times = inconsistent typing
        if features['std_flight_time'] > 300:
            return {'struggling': True, 'reason': 'Неравномерный ритм'}

        # Very long dwell times = uncertainty
        if features['avg_dwell_time'] > 200:
            return {'struggling': True, 'reason': 'Долгие нажатия - не уверен в клавишах'}

        # Very long flight times = searching for keys
        if features['avg_flight_time'] > 500:
            return {'struggling': True, 'reason': 'Ищет клавиши глазами'}

        return {'struggling': False}
```

---

### 5. **Pattern Recognition - типичные ошибки**

**Из книги:**
> "Типичные ошибки: путают П-Р, Т-Ь, Д-В (соседние клавиши). Тренируйте отдельно."

**ML for error pattern detection:**

```python
class ErrorPatternDetector:
    def __init__(self):
        self.common_confusions = defaultdict(int)

    def record_error(self, expected, typed):
        """
        Track which keys are confused with each other
        """
        if expected != typed:
            pair = f"{expected}→{typed}"
            self.common_confusions[pair] += 1

    def get_top_confusions(self, n=5):
        """
        Get most common confusion pairs
        """
        sorted_confusions = sorted(
            self.common_confusions.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_confusions[:n]

    def generate_confusion_drill(self, confusion_pairs):
        """
        Generate drill targeting specific confusions
        """
        # Example: if user confuses П and Р
        # Generate text with many "пр", "рп" combinations

        drills = []
        for pair, count in confusion_pairs:
            keys = pair.split('→')
            drill = self._generate_drill_for_pair(keys[0], keys[1])
            drills.append(drill)

        return drills

    def _generate_drill_for_pair(self, key1, key2):
        # Generate combinations
        patterns = [
            f"{key1}{key2}" * 10,
            f"{key2}{key1}" * 10,
            f"{key1}{key1}{key2}" * 7,
            f"{key2}{key2}{key1}" * 7
        ]
        return ' '.join(patterns)
```

---

### 6. **Progress Prediction - forecasting**

**ML model to predict:**
- When will user reach 60 WPM?
- How many lessons to completion?
- Probability of churn?

```python
from sklearn.linear_model import LinearRegression
import numpy as np

class ProgressPredictor:
    def __init__(self):
        self.wpm_model = LinearRegression()

    def train_wpm_model(self, user_history):
        """
        Train model to predict WPM growth
        """
        X = np.array([[h['lesson_id'], h['practice_time']] for h in user_history])
        y = np.array([h['wpm'] for h in user_history])

        self.wpm_model.fit(X, y)

    def predict_wpm_at_lesson(self, lesson_id, avg_practice_time):
        """
        Predict WPM at future lesson
        """
        prediction = self.wpm_model.predict([[lesson_id, avg_practice_time]])
        return prediction[0]

    def estimate_lessons_to_goal(self, current_wpm, goal_wpm, user_history):
        """
        Estimate how many lessons to reach goal WPM
        """
        # Calculate average WPM growth per lesson
        if len(user_history) < 3:
            avg_growth = 5  # Default estimate
        else:
            recent_growth = [
                user_history[i]['wpm'] - user_history[i-1]['wpm']
                for i in range(1, len(user_history))
            ]
            avg_growth = np.mean(recent_growth)

        if avg_growth <= 0:
            return None  # Not progressing

        lessons_needed = (goal_wpm - current_wpm) / avg_growth
        return int(np.ceil(lessons_needed))

    def predict_churn_probability(self, user_features):
        """
        Predict probability of user churning
        Features: last_session_days_ago, lesson_count, avg_wpm, barrier_lesson
        """
        # Simple rule-based (can be replaced with ML model)
        risk_score = 0

        # Time since last session
        if user_features['days_since_last_session'] > 7:
            risk_score += 0.4
        elif user_features['days_since_last_session'] > 3:
            risk_score += 0.2

        # Stuck at barrier lesson
        if user_features['current_lesson'] in [24, 25]:
            risk_score += 0.3

        # Low WPM growth
        if user_features['wpm_growth_last_5'] < 2:
            risk_score += 0.2

        # Retry count
        if user_features['retry_count'] > 3:
            risk_score += 0.1

        return min(risk_score, 1.0)
```

---

### 7. **Personalized Text Generation**

**Концепция:**
Генерировать тексты на основе:
- Weak keys пользователя
- Текущего уровня
- Профессии

```python
class PersonalizedTextGenerator:
    def __init__(self):
        self.word_corpus = self.load_corpus()

    def load_corpus(self):
        """
        Load Russian word corpus by difficulty
        """
        return {
            'easy': load_words('data/words_easy.txt'),
            'medium': load_words('data/words_medium.txt'),
            'hard': load_words('data/words_hard.txt'),
            'professional': {
                'programmer': load_words('data/words_programming.txt'),
                'journalist': load_words('data/words_journalism.txt'),
                'writer': load_words('data/words_literature.txt'),
                'office': load_words('data/words_office.txt')
            }
        }

    def generate(self, user_profile, length=100):
        """
        Generate personalized text
        """
        difficulty = user_profile['difficulty_level']
        weak_keys = user_profile.get('weak_keys', [])
        profession = user_profile.get('profession')

        # Select word pool
        if profession and user_profile['lesson'] > 60:
            word_pool = self.word_corpus['professional'][profession]
        else:
            word_pool = self.word_corpus[difficulty]

        # Filter for weak keys (if applicable)
        if weak_keys and random.random() < 0.3:
            word_pool = [w for w in word_pool if any(k in w for k in weak_keys)]

        # Generate text
        words = random.choices(word_pool, k=length)

        # Add punctuation (for advanced lessons)
        if user_profile['lesson'] > 37:
            words = self.add_punctuation(words)

        return ' '.join(words)

    def add_punctuation(self, words):
        """
        Add punctuation to word list
        """
        result = []
        for i, word in enumerate(words):
            result.append(word)
            # Random punctuation
            if (i + 1) % 10 == 0:
                result[-1] += random.choice(['.', '!', '?'])
            elif random.random() < 0.2:
                result[-1] += ','

        return result
```

---

### 8. **Rhythm Analysis - consistency detection**

**Из книги: Ритм-упражнения**

```python
class RhythmAnalyzer:
    def __init__(self):
        self.consistency_threshold = 0.3

    def analyze_rhythm(self, keystroke_intervals):
        """
        Analyze typing rhythm consistency
        """
        intervals = np.array(keystroke_intervals)

        # Remove outliers (pauses > 2 seconds)
        intervals = intervals[intervals < 2000]

        if len(intervals) < 10:
            return {'score': 0, 'consistency': 'insufficient_data'}

        # Calculate coefficient of variation
        cv = np.std(intervals) / np.mean(intervals)

        # Rhythm score (lower CV = better rhythm)
        rhythm_score = max(0, 1 - cv)

        consistency = self.classify_consistency(cv)

        return {
            'score': rhythm_score,
            'consistency': consistency,
            'avg_interval': np.mean(intervals),
            'std_interval': np.std(intervals),
            'coefficient_variation': cv
        }

    def classify_consistency(self, cv):
        """
        Classify rhythm consistency
        """
        if cv < 0.2:
            return 'excellent'
        elif cv < 0.3:
            return 'good'
        elif cv < 0.5:
            return 'fair'
        else:
            return 'poor'

    def recommend_rhythm_drill(self, rhythm_analysis):
        """
        Recommend drill if rhythm is poor
        """
        if rhythm_analysis['consistency'] in ['fair', 'poor']:
            return {
                'recommended': True,
                'drill_type': 'rhythm',
                'message': 'Твой ритм неравномерный. Попробуй ритм-упражнение!',
                'drill_text': '000 000 000 ааа ааа ааа ооо ооо ооо'
            }
        return {'recommended': False}
```

---

### 9. **Session Quality Scoring**

**Комплексная оценка сессии:**

```python
class SessionQualityScorer:
    def __init__(self):
        self.weights = {
            'wpm': 0.3,
            'accuracy': 0.3,
            'rhythm': 0.2,
            'consistency': 0.1,
            'improvement': 0.1
        }

    def score_session(self, session_data, user_history):
        """
        Calculate overall session quality score
        """
        scores = {
            'wpm': self.score_wpm(session_data['wpm']),
            'accuracy': session_data['accuracy'] / 100,
            'rhythm': session_data['rhythm_score'],
            'consistency': self.score_consistency(session_data),
            'improvement': self.score_improvement(session_data, user_history)
        }

        # Weighted average
        total_score = sum(
            scores[metric] * self.weights[metric]
            for metric in scores
        )

        return {
            'total_score': total_score,
            'breakdown': scores,
            'grade': self.get_grade(total_score),
            'feedback': self.generate_feedback(scores)
        }

    def score_wpm(self, wpm):
        """
        Normalize WPM to 0-1 scale
        """
        # Assume 0-120 WPM range
        return min(wpm / 120, 1.0)

    def score_consistency(self, session_data):
        """
        Score based on retry count and error distribution
        """
        if session_data['retry_count'] == 0:
            return 1.0
        elif session_data['retry_count'] == 1:
            return 0.8
        elif session_data['retry_count'] == 2:
            return 0.6
        else:
            return 0.4

    def score_improvement(self, session_data, user_history):
        """
        Score based on improvement over previous sessions
        """
        if len(user_history) < 1:
            return 0.5  # Neutral for first session

        prev_wpm = user_history[-1]['wpm']
        improvement = (session_data['wpm'] - prev_wpm) / prev_wpm

        # Normalize to 0-1
        return max(0, min(improvement * 2 + 0.5, 1))

    def get_grade(self, score):
        """
        Convert score to letter grade
        """
        if score >= 0.9:
            return 'A+'
        elif score >= 0.8:
            return 'A'
        elif score >= 0.7:
            return 'B'
        elif score >= 0.6:
            return 'C'
        else:
            return 'D'

    def generate_feedback(self, scores):
        """
        Generate personalized feedback
        """
        feedback = []

        if scores['wpm'] < 0.5:
            feedback.append("Работай над скоростью")
        if scores['accuracy'] < 0.9:
            feedback.append("Фокусируйся на точности")
        if scores['rhythm'] < 0.6:
            feedback.append("Попробуй ритм-упражнения")
        if scores['improvement'] < 0.4:
            feedback.append("Сделай паузу, потом повтори")

        if not feedback:
            feedback.append("Отличная работа!")

        return feedback
```

---

### 10. **Plateau Detection - обнаружение застоя**

**Из книги: Барьер на уроке 24-25**

```python
class PlateauDetector:
    def __init__(self):
        self.plateau_threshold = {
            'lessons': 3,  # No improvement for 3 lessons
            'wpm_change': 5  # WPM change < 5
        }

    def detect_plateau(self, user_history):
        """
        Detect if user is stuck at plateau
        """
        if len(user_history) < self.plateau_threshold['lessons']:
            return {'plateau': False}

        last_n = user_history[-self.plateau_threshold['lessons']:]

        wpm_values = [h['wpm'] for h in last_n]
        wpm_range = max(wpm_values) - min(wpm_values)

        # Check if WPM is stagnant
        if wpm_range < self.plateau_threshold['wpm_change']:
            # Check if this is the known barrier (lesson 24-25)
            current_lesson = user_history[-1]['lesson_id']
            is_known_barrier = current_lesson in [24, 25]

            return {
                'plateau': True,
                'duration': len(last_n),
                'wpm_range': wpm_range,
                'current_lesson': current_lesson,
                'is_known_barrier': is_known_barrier,
                'recommendation': self.get_recommendation(is_known_barrier)
            }

        return {'plateau': False}

    def get_recommendation(self, is_known_barrier):
        """
        Get recommendation for plateau
        """
        if is_known_barrier:
            return {
                'message': "Ты на 'невидимой стене' (урок 24-25). Это нормально!",
                'actions': [
                    "Сделай перерыв 1-2 дня",
                    "Повтори уроки 20-23",
                    "Читай истории успеха",
                    "Не сдавайся - прорыв близко!"
                ],
                'motivation': "90% прошедших урок 25 завершают весь курс!"
            }
        else:
            return {
                'message': "Твой прогресс замедлился.",
                'actions': [
                    "Попробуй печатать медленнее, фокусируйся на точности",
                    "Сделай ритм-упражнение",
                    "Проверь weak keys - может быть проблема",
                    "Сделай перерыв"
                ]
            }
```

---

### 11. **Optimal Session Duration Recommendation**

**Из книги: 15 минут оптимально**

```python
class SessionDurationOptimizer:
    def __init__(self):
        self.optimal_duration = 15 * 60  # 15 minutes in seconds

    def analyze_session_duration(self, user_history):
        """
        Analyze user's session durations and recommend optimal
        """
        session_durations = [h['session_duration'] for h in user_history]
        session_quality = [h['quality_score'] for h in user_history]

        # Find correlation between duration and quality
        correlation = np.corrcoef(session_durations, session_quality)[0, 1]

        # Find optimal duration (where quality is highest)
        optimal_idx = np.argmax(session_quality)
        user_optimal_duration = session_durations[optimal_idx]

        return {
            'recommended_duration': self.optimal_duration,
            'user_optimal_duration': user_optimal_duration,
            'correlation': correlation,
            'advice': self.get_duration_advice(user_optimal_duration)
        }

    def get_duration_advice(self, user_optimal):
        """
        Give advice on session duration
        """
        if user_optimal < 10 * 60:
            return "Попробуй заниматься чуть дольше (15 мин оптимально)"
        elif user_optimal > 30 * 60:
            return "Ты занимаешься слишком долго - делай больше перерывов"
        else:
            return "Отличная длительность сессий!"
```

---

### 12. **Recommendation Engine**

**Финальная система рекомендаций:**

```python
class TypingRecommendationEngine:
    def __init__(self):
        self.weak_keys_detector = WeakKeysDetector()
        self.skill_classifier = SkillLevelClassifier()
        self.plateau_detector = PlateauDetector()
        self.rhythm_analyzer = RhythmAnalyzer()

    def get_recommendations(self, user_data):
        """
        Generate comprehensive recommendations
        """
        recommendations = []

        # 1. Check for weak keys
        weak_keys = self.weak_keys_detector.detect_weak_keys()
        if weak_keys:
            recommendations.append({
                'type': 'weak_keys',
                'priority': 'high',
                'message': f"Слабые клавиши: {', '.join([wk['key'] for wk in weak_keys[:3]])}",
                'action': 'Попробуй персональное упражнение'
            })

        # 2. Check for plateau
        plateau = self.plateau_detector.detect_plateau(user_data['history'])
        if plateau['plateau']:
            recommendations.append({
                'type': 'plateau',
                'priority': 'critical' if plateau['is_known_barrier'] else 'high',
                'message': plateau['recommendation']['message'],
                'actions': plateau['recommendation']['actions']
            })

        # 3. Check rhythm
        rhythm = self.rhythm_analyzer.analyze_rhythm(user_data['keystroke_intervals'])
        if rhythm['consistency'] in ['fair', 'poor']:
            recommendations.append({
                'type': 'rhythm',
                'priority': 'medium',
                'message': 'Неравномерный ритм',
                'action': 'Попробуй ритм-упражнение'
            })

        # 4. Skill level progression
        skill = self.skill_classifier.classify(user_data['features'])
        recommendations.append({
            'type': 'progression',
            'priority': 'low',
            'message': f"Текущий уровень: {skill['level']}",
            'action': skill['next_goal']
        })

        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order[x['priority']])

        return recommendations[:3]  # Return top 3
```

---

## 🎯 Action Items для AI/ML

### Immediate (Sprint 1):
- [ ] Implement weak keys detection
- [ ] Build basic skill level classifier (rule-based)
- [ ] Create personalized drill generator
- [ ] Set up data collection pipeline

### Short-term (Sprint 2-3):
- [ ] Keystroke dynamics analysis
- [ ] Error pattern detection
- [ ] Rhythm analyzer
- [ ] Plateau detector
- [ ] Session quality scorer

### Long-term (Sprint 4+):
- [ ] Progress prediction model
- [ ] Churn prediction model
- [ ] Advanced personalized text generation
- [ ] Recommendation engine
- [ ] A/B testing framework for ML features

---

## 📊 Metrics for ML Models

```python
ml_metrics = {
    # Model performance
    'weak_keys_precision': "> 0.85",
    'skill_classifier_accuracy': "> 0.90",
    'plateau_detection_recall': "> 0.95",  # Don't miss plateaus!
    'churn_prediction_auc': "> 0.80",

    # Business impact
    'personalized_drill_effectiveness': "+20% improvement vs generic",
    'recommendation_engagement': "> 60% click-through",
    'adaptive_difficulty_retention': "+15% vs fixed",

    # Data quality
    'keystroke_data_completeness': "> 99%",
    'session_data_quality': "> 95%"
}
```

---

## 🔗 Референсы

**Training summaries:**
- [Сессия 1](./training_session_1_summary.md)
- [Сессия 2](./training_session_2_summary.md)
- [Сессия 3](./training_session_3_summary.md)
- [Сессия 4](./training_session_4_summary.md)

---

**Статус:** ✅ Обучение завершено
**Координатор:** Клод
**Дата:** 2025-11-19
