# -*- coding: utf-8 -*-
"""
Автоматическая генерация text_sequence для уроков
Генерирует JSON-массив с маппингом символов на hand/finger/key
"""

# Маппинг русских символов на клавиши (ЙЦУКЕН раскладка)
KEY_MAPPING = {
    # Левая рука
    'ф': {'finger': 'pinky', 'key': 'Ф'},
    'ы': {'finger': 'ring', 'key': 'Ы'},
    'в': {'finger': 'middle', 'key': 'В'},
    'а': {'finger': 'index', 'key': 'А'},
    'п': {'finger': 'index', 'key': 'П'},
    'р': {'finger': 'index', 'key': 'Р'},
    'о': {'finger': 'index', 'key': 'О'},
    'л': {'finger': 'middle', 'key': 'Л'},
    'д': {'finger': 'ring', 'key': 'Д'},
    'ж': {'finger': 'pinky', 'key': 'Ж'},
    'э': {'finger': 'pinky', 'key': 'Э'},

    # Верхний ряд левая
    'й': {'finger': 'pinky', 'key': 'Й'},
    'ц': {'finger': 'ring', 'key': 'Ц'},
    'у': {'finger': 'middle', 'key': 'У'},
    'к': {'finger': 'index', 'key': 'К'},
    'е': {'finger': 'index', 'key': 'Е'},
    'н': {'finger': 'index', 'key': 'Н'},
    'г': {'finger': 'index', 'key': 'Г'},
    'ш': {'finger': 'ring', 'key': 'Ш'},
    'щ': {'finger': 'pinky', 'key': 'Щ'},
    'з': {'finger': 'index', 'key': 'З'},
    'х': {'finger': 'pinky', 'key': 'Х'},
    'ъ': {'finger': 'pinky', 'key': 'Ъ'},

    # Нижний ряд
    'я': {'finger': 'pinky', 'key': 'Я'},
    'ч': {'finger': 'ring', 'key': 'Ч'},
    'с': {'finger': 'middle', 'key': 'С'},
    'м': {'finger': 'index', 'key': 'М'},
    'и': {'finger': 'index', 'key': 'И'},
    'т': {'finger': 'index', 'key': 'Т'},
    'ь': {'finger': 'index', 'key': 'Ь'},
    'б': {'finger': 'index', 'key': 'Б'},
    'ю': {'finger': 'pinky', 'key': 'Ю'},

    # Специальные
    'ё': {'finger': 'pinky', 'key': 'Ё'},
}

def determine_hand(char, prev_char):
    """
    Определяет, какой рукой печатать символ (для split space bar)
    """
    # Символы левой руки (левая половина клавиатуры)
    LEFT_HAND_CHARS = set('фывапролдёйцукенгшщзхъячсмитьб')
    # Символы правой руки (правая половина)
    RIGHT_HAND_CHARS = set('жэ')

    # Для большинства букв определяем по положению на клавиатуре
    # Но для корректной работы split space используем предыдущий символ
    if char in LEFT_HAND_CHARS:
        return 'left'
    elif char in RIGHT_HAND_CHARS:
        return 'right'
    else:
        # По умолчанию чередуем руки
        if prev_char and prev_char in LEFT_HAND_CHARS:
            return 'left'
        else:
            return 'right'

def generate_text_sequence(text):
    """
    Генерирует массив text_sequence из текста
    """
    sequence = []
    prev_char = None
    prev_hand = None

    for i, char in enumerate(text):
        if char == ' ':
            # Пробел — противоположная рука от предыдущего символа
            space_side = 'right' if prev_hand == 'left' else 'left'
            sequence.append({
                "char": " ",
                "hand": 'right' if prev_hand == 'left' else 'left',
                "finger": "thumb",
                "key": "Space",
                "space_side": space_side
            })
            prev_hand = 'right' if prev_hand == 'left' else 'left'
        elif char in KEY_MAPPING:
            hand = determine_hand(char, prev_char)
            mapping = KEY_MAPPING[char]
            sequence.append({
                "char": char,
                "hand": hand,
                "finger": mapping['finger'],
                "key": mapping['key']
            })
            prev_char = char
            prev_hand = hand
        else:
            print(f"Предупреждение: символ '{char}' не найден в маппинге")

    return sequence

def main():
    # Пример использования
    text = "ёж жадно ждал холод въезд эра поход объявлял мёд даём поля воля лёд выдох вдох ходьба яд фляга жар эхо подъезд даёшь поём жара хорошо флаг фара объяд"

    sequence = generate_text_sequence(text)

    # Вывод JSON
    import json
    print(json.dumps(sequence, ensure_ascii=False, indent=2))
    print(f"\nВсего символов: {len(text)}")
    print(f"Элементов в sequence: {len(sequence)}")

if __name__ == "__main__":
    main()
