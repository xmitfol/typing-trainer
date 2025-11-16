**🎨**** Frontend Architecture**
**Typing Trainer SaaS - ****Детальный**** ****дизайн**
**Версия:** 1.0
**Дата:** 09 октября 2025
**Связанные документы:** 

**📋**** Содержание**









**🎯**** Архитектурный подход**
**Эволюция ****Frontend**
MVP (v1.0)          v2.0              v3.0
──────────────────────────────────────────────
Vanilla JS    →    React SPA    →    Next.js SSR
No framework       + TypeScript       + Advanced
LocalStorage       + Zustand          + Real-time
Pure CSS           + Tailwind         + PWA
**Ключевые**** ****принципы**
**1. ****Component-Driven**** Development**
Изолированные компоненты
Переиспользуемость
Storybook для документации
**2. ****Progressive**** ****Enhancement**
Работает без JS (базово)
Graceful degradation
Accessibility first (WCAG 2.1)
**3. Performance First**
Code splitting
Lazy loading
Optimistic UI updates
Virtual scrolling для больших списков
**4. Mobile-First**
Responsive design
Touch-friendly
Offline capable

**📁**** Структура проекта**
**MVP (****Vanilla**** JS)**
typing-trainer/
├── index.html                    # Single page
├── assets/
│   ├── css/
│   │   ├── main.css             # Основные стили
│   │   ├── keyboard.css         # Клавиатура
│   │   ├── components.css       # UI компоненты
│   │   ├── modal.css            # Модальные окна
│   │   └── responsive.css       # Адаптивность
│   │
│   ├── js/
│   │   ├── main.js              # Инициализация приложения
│   │   ├── keyboard-layouts.js  # Раскладки клавиатуры
│   │   ├── keyboard-controller.js # Логика клавиатуры
│   │   ├── typing-session.js    # Сессия печати
│   │   ├── stats-calculator.js  # Расчет статистики
│   │   ├── modal.js             # Модальные окна
│   │   ├── courses-loader.js    # Загрузка курсов
│   │   └── utils.js             # Утилиты
│   │
│   └── fonts/
│       └── inter/               # Web fonts
│
├── data/
│   ├── courses/                 # Данные курсов
│   │   ├── adults/
│   │   │   ├── en/
│   │   │   │   ├── course.json
│   │   │   │   └── lessons/
│   │   │   │       ├── lesson-001.json
│   │   │   │       └── ...
│   │   │   └── ru/
│   │   │       └── ...
│   │   ├── teens/
│   │   └── kids/
│   │
│   └── i18n/                    # Переводы интерфейса
│       ├── en.json
│       └── ru.json
│
└── config/
    └── settings.js              # Конфигурация
**v2.0 (React)**
typing-trainer-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service Worker
│
├── src/
│   ├── app/                     # App configuration
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers.tsx        # Context providers
│   │
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── SocialAuth.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── courses/
│   │   │   ├── components/
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── LessonList.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCourse.ts
│   │   │   │   └── useLesson.ts
│   │   │   └── services/
│   │   │       └── courseService.ts
│   │   │
│   │   ├── typing/
│   │   │   ├── components/
│   │   │   │   ├── Keyboard/
│   │   │   │   │   ├── Keyboard.tsx
│   │   │   │   │   ├── Key.tsx
│   │   │   │   │   └── KeyHighlight.tsx
│   │   │   │   ├── TextEditor/
│   │   │   │   │   ├── TextEditor.tsx
│   │   │   │   │   ├── Cursor.tsx
│   │   │   │   │   └── ErrorHighlight.tsx
│   │   │   │   └── StatsPanel/
│   │   │   │       ├── StatsPanel.tsx
│   │   │   │       ├── WPMDisplay.tsx
│   │   │   │       └── AccuracyChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useKeyboard.ts
│   │   │   │   ├── useTypingSession.ts
│   │   │   │   └── useKeystrokes.ts
│   │   │   └── services/
│   │   │       └── typingService.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── StatsDashboard.tsx
│   │   │   │   ├── ProgressChart.tsx
│   │   │   │   └── WeakKeysReport.tsx
│   │   │   └── hooks/
│   │   │       └── useAnalytics.ts
│   │   │
│   │   └── ai/
│   │       ├── components/
│   │       │   ├── AICoach.tsx
│   │       │   ├── Recommendations.tsx
│   │       │   └── AdaptiveExercise.tsx
│   │       └── hooks/
│   │           └── useAI.ts
│   │
│   ├── shared/                  # Переиспользуемые компоненты
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.stories.tsx
│   │   │   ├── Modal/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── Spinner/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useOnClickOutside.ts
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── validators.ts
│   │       └── constants.ts
│   │
│   ├── store/                   # State management
│   │   ├── auth/
│   │   │   └── authStore.ts
│   │   ├── lesson/
│   │   │   └── lessonStore.ts
│   │   ├── typing/
│   │   │   └── typingStore.ts
│   │   └── index.ts
│   │
│   ├── services/                # API clients
│   │   ├── api/
│   │   │   ├── client.ts        # Axios config
│   │   │   └── interceptors.ts
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── stats/
│   │   └── ai/
│   │
│   ├── types/                   # TypeScript types
│   │   ├── api.types.ts
│   │   ├── course.types.ts
│   │   ├── user.types.ts
│   │   └── typing.types.ts
│   │
│   ├── styles/                  # Global styles
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   │
│   └── config/
│       ├── constants.ts
│       └── env.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .storybook/                  # Storybook config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

**🏪**** State Management**
**MVP: LocalStorage + Vanilla JS**
// Simple state management
class AppState {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    const saved = localStorage.getItem('appState');
    return saved ? JSON.parse(saved) : this.getInitialState();
  }

  getInitialState() {
    return {
      user: null,
      currentLesson: null,
      progress: {},
      settings: {
        language: 'en',
        theme: 'light',
        soundEnabled: true
      }
    };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    localStorage.setItem('appState', JSON.stringify(this.state));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Singleton instance
const appState = new AppState();
export default appState;
**v2.0: Zustand**
// stores/typingStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TypingState {
  // State
  currentLesson: Lesson | null;
  isTyping: boolean;
  startTime: number | null;
  keystrokes: Keystroke[];
  errors: number;

  // Computed
  wpm: number;
  accuracy: number;

  // Actions
  startSession: (lesson: Lesson) => void;
  recordKeystroke: (keystroke: Keystroke) => void;
  endSession: () => void;
  calculateStats: () => void;
}

export const useTypingStore = create<TypingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentLesson: null,
        isTyping: false,
        startTime: null,
        keystrokes: [],
        errors: 0,
        wpm: 0,
        accuracy: 100,

        // Actions
        startSession: (lesson) => {
          set({
            currentLesson: lesson,
            isTyping: true,
            startTime: Date.now(),
            keystrokes: [],
            errors: 0
          });
        },

        recordKeystroke: (keystroke) => {
          const { keystrokes, errors } = get();

          set({
            keystrokes: [...keystrokes, keystroke],
            errors: keystroke.correct ? errors : errors + 1
          });

          // Trigger stats recalculation
          get().calculateStats();
        },

        calculateStats: () => {
          const { keystrokes, startTime } = get();

          if (!startTime || keystrokes.length === 0) return;

          const elapsedMinutes = (Date.now() - startTime) / 60000;
          const correctKeystrokes = keystrokes.filter(k => k.correct).length;

          const wpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
          const accuracy = Math.round((correctKeystrokes / keystrokes.length) * 100);

          set({ wpm, accuracy });
        },

        endSession: () => {
          set({
            isTyping: false,
            startTime: null
          });
        }
      }),
      {
        name: 'typing-storage',
        partialize: (state) => ({
          // Only persist these fields
          currentLesson: state.currentLesson
        })
      }
    )
  )
);
**Преимущества**** Zustand:**
✅ Простой API (проще Redux)
✅ TypeScript из коробки
✅ DevTools интеграция
✅ Persist middleware
✅ Отличная производительность

**🧩**** Компонентная архитектура**
**Принципы**
**1. ****Atomic**** Design**
Atoms       → Button, Input, Icon
Molecules   → SearchBar, StatCard
Organisms   → Keyboard, TextEditor, StatsPanel
Templates   → LessonTemplate, DashboardTemplate
Pages       → LessonPage, ProfilePage
**2. Composition over Inheritance**
// ❌ Bad: Inheritance
class FancyButton extends Button {}

// ✅ Good: Composition
const FancyButton = ({ children, ...props }) => (
  <Button {...props} className="fancy-styles">
    <Icon name="star" />
    {children}
  </Button>
);
**3. Container/Presentational Pattern**
// Container (logic)
const LessonPageContainer = () => {
  const lesson = useLesson();
  const { startSession, recordKeystroke } = useTypingStore();

  return (
    <LessonPage
      lesson={lesson}
      onStart={startSession}
      onKeystroke={recordKeystroke}
    />
  );
};

// Presentational (UI)
const LessonPage = ({ lesson, onStart, onKeystroke }) => (
  <div className="lesson-page">
    <TextEditor lesson={lesson} onKeystroke={onKeystroke} />
    <Keyboard />
    <StatsPanel />
  </div>
);

**Ключевые**** ****компоненты**
**1. Keyboard Component**
// features/typing/components/Keyboard/Keyboard.tsx
interface KeyboardProps {
  layout: 'qwerty' | 'йцукен';
  highlightKey?: string;
  onKeyPress?: (key: string) => void;
  showHandPosition?: boolean;
}

export const Keyboard: React.FC<KeyboardProps> = ({
  layout,
  highlightKey,
  onKeyPress,
  showHandPosition = true
}) => {
  const keyboardLayout = useKeyboardLayout(layout);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(e.key));
      onKeyPress?.(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyPress]);

  return (
    <div className="keyboard">
      {keyboardLayout.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.keys.map(key => (
            <Key
              key={key.code}
              {...key}
              isPressed={pressedKeys.has(key.value)}
              isHighlighted={key.value === highlightKey}
              fingerColor={key.finger}
            />
          ))}
        </div>
      ))}

      {showHandPosition && <HandPositionGuide />}
    </div>
  );
};
**2. TextEditor Component**
// features/typing/components/TextEditor/TextEditor.tsx
interface TextEditorProps {
  text: string;
  onKeystroke: (keystroke: Keystroke) => void;
  disabled?: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onKeystroke,
  disabled = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<number[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();

      const expected = text[currentIndex];
      const actual = e.key;
      const isCorrect = expected === actual;

      // Record keystroke
      onKeystroke({
        expected,
        actual,
        correct: isCorrect,
        timestamp: Date.now(),
        index: currentIndex
      });

      // Update state
      setTypedText(prev => prev + actual);
      setCurrentIndex(prev => prev + 1);

      if (!isCorrect) {
        setErrors(prev => [...prev, currentIndex]);
      }

      // Auto-scroll
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [text, currentIndex, disabled, onKeystroke]);

  return (
    <div className="text-editor" ref={editorRef}>
      <div className="text-display">
        {text.split('').map((char, index) => (
          <CharacterDisplay
            key={index}
            char={char}
            status={
              index < currentIndex
                ? errors.includes(index)
                  ? 'error'
                  : 'correct'
                : index === currentIndex
                ? 'current'
                : 'pending'
            }
          />
        ))}
      </div>

      <Cursor position={currentIndex} />
    </div>
  );
};
**3. StatsPanel Component**
// features/typing/components/StatsPanel/StatsPanel.tsx
export const StatsPanel: React.FC = () => {
  const { wpm, accuracy, errors, duration } = useTypingStore();
  const { bestWPM, avgWPM } = useUserStats();

  return (
    <div className="stats-panel">
      <StatCard
        title="Speed"
        value={wpm}
        unit="WPM"
        trend={wpm > bestWPM ? 'up' : 'down'}
        color="blue"
      />

      <StatCard
        title="Accuracy"
        value={accuracy}
        unit="%"
        target={95}
        color="green"
      />

      <StatCard
        title="Errors"
        value={errors}
        color="red"
      />

      <StatCard
        title="Time"
        value={formatDuration(duration)}
        color="purple"
      />

      <ProgressBar
        current={wpm}
        target={100}
        label="Goal: 100 WPM"
      />
    </div>
  );
};

**🧭**** Routing & Navigation**
**MVP: Hash Routing**
// Simple hash-based routing
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const handler = this.routes.get(hash);

    if (handler) {
      handler();
      this.currentRoute = hash;
    } else {
      this.navigate('/');
    }
  }
}

// Usage
const router = new Router();

router.register('/', () => renderHomePage());
router.register('/lesson/:id', (params) => renderLesson(params.id));
router.register('/profile', () => renderProfile());
**v2.0: React Router**
// app/Router.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

// Protected route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

**🔄**** Data Flow**
**Architecture Pattern: Unidirectional Data Flow**
┌──────────────────────────────────────┐
│          User Action                 │
│  (Click, Type, Navigate)             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Event Handler                  │
│  (onClick, onKeyPress)               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Store Action                   │
│  (startSession, recordKeystroke)     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       State Update                   │
│  (Zustand store mutation)            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Re-render                      │
│  (React components update)           │
└──────────────────────────────────────┘

**⚡**** Performance Optimization**
**Techniques**
**1. Code Splitting**
// Lazy load heavy components
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AICoach = lazy(() => import('./features/ai/components/AICoach'));

<Suspense fallback={<Spinner />}>
  <AnalyticsPage />
</Suspense>
**2. Memoization**
// Memo expensive components
const Keyboard = memo(({ layout }) => {
  // Heavy rendering logic
}, (prevProps, nextProps) => {
  return prevProps.layout === nextProps.layout;
});

// useMemo for expensive calculations
const stats = useMemo(() => {
  return calculateDetailedStats(keystrokes);
}, [keystrokes]);
**3. Virtual Scrolling**
// For long lists (lesson history, leaderboards)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <LessonHistoryItem lesson={lessons[index]} />
    </div>
  )}
</FixedSizeList>
**4. Image Optimization**
// Next.js Image component
import Image from 'next/image';

<Image
  src="/characters/typie-cat.png"
  alt="Typie Cat"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
/>

**📴**** Offline Support**
**Service Worker Strategy**
// public/sw.js
const CACHE_NAME = 'typing-trainer-v1';
const urlsToCache = [
  '/',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/data/courses/adults/en/course.json'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - Network First, Cache Fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});
**IndexedDB for Offline Data**
// services/offline/db.ts
import { openDB, DBSchema } from 'idb';

interface TypingDB extends DBSchema {
  keystrokes: {
    key: number;
    value: Keystroke;
  };
  lessons: {
    key: string;
    value: Lesson;
  };
}

const dbPromise = openDB<TypingDB>('typing-trainer-db', 1, {
  upgrade(db) {
    db.createObjectStore('keystrokes', { autoIncrement: true });
    db.createObjectStore('lessons', { keyPath: 'id' });
  }
});

// Save keystroke offline
export async function saveKeystroke(keystroke: Keystroke) {
  const db = await dbPromise;
  await db.add('keystrokes', keystroke);
}

// Sync when online
export async function syncOfflineData() {
  const db = await dbPromise;
  const keystrokes = await db.getAll('keystrokes');

  if (keystrokes.length > 0) {
    await api.post('/sync', { keystrokes });
    await db.clear('keystrokes');
  }
}

**📊**** Метрики и мониторинг**
**Web ****Vitals**
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  analytics.track('web_vital', {
    name: metric.name,
    value: metric.value,
    id: metric.id
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

**Статус:** ✅ Готово к реализации
**Следующий документ:** Backend Architecture
**Дата:** 09 октября 2025
