// lesson-data.js — lesson content keyed by tier + lesson number
// In production this comes from the backend / config. Here a few sample lessons
// so task.html works standalone.

(function (global) {
  'use strict';

  // Each lesson has exercises. Each exercise has a target string + finger hint.
  const LESSONS = {
    'tier1-1': {
      module: 1,
      title: 'Главное — нащупать пупочки',
      mentor: 'maxim',
      exercises: [
        { id: '1.1', target: 'фыва олдж фыва олдж', hint: 'Указательные на «а» и «о»' },
        { id: '1.2', target: 'фо ыл вд ап жд ао', hint: 'Чередуй левую и правую руку' },
        { id: '1.3', target: 'оаоа лждл фывап', hint: 'Держи ровный ритм' },
      ],
      tips: [
        'Не торопись — печатай ровно. Скорость придёт сама.',
        'Если рука «уехала» — верни указательные на пупочки.',
        'Ритм важнее скорости. Каждая клавиша — один щелчок.',
      ],
    },
    'tier1-6': {
      module: 1,
      title: 'Вы попали на самый кончик?',
      mentor: 'maxim',
      exercises: [
        { id: '6.1', target: 'ппп ррр ппр рпп', hint: 'Указательные · левый и правый' },
        { id: '6.2', target: 'папа врал поле плов', hint: 'Указ. + средний палец' },
        { id: '6.3', target: 'ваша опора — пальцы', hint: 'Все пальцы в работе' },
      ],
      tips: [
        'Указательные уходят чуть в сторону — не отрывай остальные.',
        'Сложно? Сбавь темп. Точность важнее.',
        'Backspace потом — сначала допечатай строку.',
      ],
    },
  };

  // Parse ?tier=tier1&lesson=1 from URL
  function getParams() {
    const p = new URLSearchParams(global.location.search);
    return {
      tier: p.get('tier') || 'tier1',
      lesson: parseInt(p.get('lesson') || '1', 10),
    };
  }

  function getLesson(tier, lesson) {
    return LESSONS[`${tier}-${lesson}`] || LESSONS['tier1-1'];
  }

  global.lessonData = { LESSONS, getParams, getLesson };
})(window);
