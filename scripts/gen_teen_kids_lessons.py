"""
Generate Teen/Kids EN lesson JSON files from inline content tables.
One-shot script — run once, JSON files appear in data/lessons/en_teen/ and en_kids/.

Teen course (75 lessons, 5 blocks of 15):
  Block 1 (1-15): Foundation — home row → full alphabet, target WPM 18→40
  Block 2 (16-30): Top/bottom rows, deferred until later session
  Block 3 (31-45): Numbers + emoji + slang
  Block 4 (46-60): Speed sprints
  Block 5 (61-75): Real-world (school assignments, social posts) + final

Kids course (50 lessons, 5 blocks of 10):
  Block 1 (1-10): Single keys, very gentle, target WPM 8→18
  ... (rest in later sessions)

This script generates ONLY Block 1 for each (15 + 10 = 25 lessons).
"""
import json
from pathlib import Path

OUT_TEEN = Path(__file__).resolve().parent.parent / 'data' / 'lessons' / 'en_teen'
OUT_KIDS = Path(__file__).resolve().parent.parent / 'data' / 'lessons' / 'en_kids'
OUT_TEEN.mkdir(parents=True, exist_ok=True)
OUT_KIDS.mkdir(parents=True, exist_ok=True)


def build_lesson(tier, num, title, desc, wpm, text, keys, focus, tips, char_tips,
                  phase=1, rhythm=False, error_pct=8):
    text_len = len(text)
    return {
        "id": f"{tier}_lesson_{num:02d}",
        "tier": tier,
        "lesson_number": num,
        "title": title,
        "description": desc,
        "target_wpm": wpm,
        "text_length": text_len,
        "error_limit_percent": error_pct,
        "error_limit": max(2, int(text_len * error_pct / 100)),
        "text": text,
        "text_sequence": [],
        "keys_trained": keys,
        "new_keys": [],
        "finger_focus": focus,
        "tips": tips,
        "character_tips": char_tips,
        "phase": phase,
        "rhythmLesson": rhythm,
        "created_at": "2026-05-25",
        "version": "1.0"
    }


# === TEEN BLOCK 1 (1-15) — Foundation, home row → full alphabet ===
# Mentor: Knopych (robot key, playful but cool for teens)
# Style: short bursts, game/social references, encouraging
TEEN_B1 = [
    (1, "Home row: ASDF JKL;",
     "Welcome to Teen Course! Start with the resting position of your fingers.",
     18, "asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;",
     ["A","S","D","F","J","K","L",";","Space"],
     "Home row — left and right hands",
     ["These 8 keys are home base — return here after every keystroke",
      "Feel the bumps on F and J — those are your anchors",
      "Don't look at the keyboard. Trust your hands."],
     {"anna": "Home row first. Find F and J by feel — those bumps are your anchors.",
      "maxim": "ASDF JKL; — eight keys you'll return to a million times. Start here.",
      "knopych": "BEEP BOOP! Home row activated! 🤖 Find F and J — those bumps! Got 'em?",
      "klavochka": "These are your finger pillows, my dear! Cozy and ready 💤"},
     1, False, 8),

    (2, "Home row: real words",
     "Build short words from home row keys only",
     20, "ask sad lad fall sass lass dad fad jak lad dad fall sass ask",
     ["A","S","D","F","J","K","L","Space"],
     "Home row word formation",
     ["Real words from just home row — you can already write!",
      "Notice your fingers barely move",
      "Spaces with thumb — keep it light"],
     {"anna": "Real words already, just from home row. Your fingers know the pattern.",
      "maxim": "Eight keys, dozens of words. The keyboard rewards efficiency.",
      "knopych": "WORDS UNLOCKED! 🎮 Home row OP — overpowered!",
      "klavochka": "Look at you, writing real words! 🌸 Tiny victory!"},
     1, False, 8),

    (3, "Home row: short sentences",
     "Practice rhythm with home-row sentences",
     22, "a sad lad asks dad; a lass falls; dads ask lads;",
     ["A","S","D","F","J","K","L",";","Space"],
     "Home row + punctuation intro",
     ["Sentences with only home-row letters",
      "Semicolons live on home row too — pinky right",
      "Don't break flow at the spaces"],
     {"anna": "Sentences without leaving home row. Notice how little your hands move?",
      "maxim": "Efficiency starts with minimal movement. Every keystroke earned.",
      "knopych": "SENTENCE COMBO! 🎯 Multi-word attack!",
      "klavochka": "A little story from home row, my sunshine ☀️"},
     1, False, 8),

    (4, "Rhythm: home-row flow",
     "Find your rhythm with home-row words",
     24, "ask ask ask sad sad sad lad lad lad jak jak jak dad dad dad fall fall fall lass lass lass",
     ["A","S","D","F","J","K","L","Space"],
     "Home row rhythm",
     ["Each word repeated — focus on rhythm, not novelty",
      "Enable metronome at 24 BPM — match your finger tempo",
      "Don't speed up — find a steady beat"],
     {"anna": "Repetition builds rhythm. The same word four times = muscle memory.",
      "maxim": "Boring is gold for typing — repetition cements the path.",
      "knopych": "REPETITION TRAINING! 🥁 Tap-tap-tap, level up!",
      "klavochka": "Like a song chorus, my dear — same notes, sweet rhythm 🎶"},
     1, True, 8),

    (5, "Top row: Q W E R T",
     "Move up to top row — left hand reaches",
     26, "we we we re re re ter ter ter wet wet wet sew sew sew red red red were were tree tree",
     ["Q","W","E","R","T","A","S","D","F","Space"],
     "Left top row + home row mix",
     ["Q-W-E-R-T are stretches UP from home row",
      "Reach with the SAME finger that owns each column",
      "Return to home row after each top-row keystroke"],
     {"anna": "Stretch UP to top row, then immediately return to home row.",
      "maxim": "QWERT is left hand's reach. Every typist learns this stretch.",
      "knopych": "TOP ROW UNLOCKED! ⬆️ Reach high, return home!",
      "klavochka": "Tippy-toes for fingers, my dear 🌷"},
     1, False, 8),

    (6, "Top row: Y U I O P",
     "Right hand top row",
     28, "you you you our our our up up up pop pop pop joy joy joy try try try poi poi poi pour pour",
     ["Y","U","I","O","P","J","K","L",";","Space"],
     "Right top row + home row mix",
     ["YUIOP completes the top row",
      "Right pinky reaches for P — careful, it's a stretch",
      "Use the same finger that owns each column"],
     {"anna": "Right hand top row. P is the pinky stretch — practice it.",
      "maxim": "Top row complete. You now control 20 letters.",
      "knopych": "RIGHT TOP ROW! ⬆️🟢 Both hands now reaching high!",
      "klavochka": "Both hands flying up, my treasure 🦋"},
     1, False, 8),

    (7, "Bottom row: Z X C V B",
     "Left hand bottom — the trickiest reach",
     30, "ax ax ax cab cab cab vex vex vex back back back zap zap zap five five five bake bake bake",
     ["Z","X","C","V","B","A","S","D","F","Space"],
     "Left bottom + home row",
     ["Bottom row = DOWN from home — most awkward stretch",
      "Curl fingers under to reach",
      "Z and X are rare — but you still need them"],
     {"anna": "Bottom row is hardest. Curl your fingers UNDER your palms to reach.",
      "maxim": "Master the bottom row = master 95% of typing struggles.",
      "knopych": "BOTTOM ROW BOSS! ⬇️ Curl those fingers!",
      "klavochka": "Reaching low like picking flowers, my dear 🌻"},
     1, False, 8),

    (8, "Bottom row: N M",
     "Right hand bottom complete",
     32, "man man man and and and now now now men men men come come come name name name money money money",
     ["N","M","J","K","L","Space"],
     "Right bottom + home row",
     ["N and M are right index/middle finger reaches DOWN",
      "Common letters — N and M appear in 90% of sentences",
      "After this lesson, you know all 26 letters"],
     {"anna": "N and M complete your alphabet. From here, you can type anything.",
      "maxim": "All 26 letters online. The rest is practice.",
      "knopych": "ALPHABET COMPLETE! 🔓 26/26 letters unlocked!",
      "klavochka": "Every letter your friend now, my sunshine ☀️"},
     1, False, 8),

    (9, "Rhythm: full alphabet flow",
     "All 26 letters, find your tempo",
     33, "the quick fox jumps over a lazy dog; my brave aunt and gentle uncle keep happy plants in the warm kitchen window today",
     ["A-Z","Space",";",","],
     "Full alphabet rhythm",
     ["All 26 letters in natural sentences",
      "Pangram + extra prose = full keyboard test",
      "Metronome at 33 BPM — hold steady"],
     {"anna": "Every letter in flow. Find a rhythm and don't break it.",
      "maxim": "Full alphabet at 33 WPM = solid foundation. Keep building.",
      "knopych": "FULL ALPHABET FLOW! 🌊 All keys in formation!",
      "klavochka": "All your friends together, my dear 💕"},
     1, True, 8),

    (10, "Capitals and names",
     "Shift + letter for capital letters",
     34, "Sam Alex Maya Jake Lisa Anna Carlos Priya Diego Mei Olivia Marco Yuki Rosa David Hannah",
     ["Shift","A-Z","Space"],
     "Shift + letter timing",
     ["Press Shift BEFORE the letter — not after",
      "Use the Shift on the OPPOSITE side of your letter",
      "Names are everywhere — train them at speed"],
     {"anna": "Shift before letter — opposite hand. That's the pro pattern.",
      "maxim": "Capital letters = names + sentence starts. Train them now.",
      "knopych": "SHIFT MOVE! 🎯 Opposite hand always — got it?",
      "klavochka": "Tall friendly capitals, my dear — like proud trees 🌳"},
     1, False, 8),

    (11, "Numbers row: 1-5 (left hand)",
     "Reach to the numbers row — left side",
     35, "1 2 3 4 5 12 23 34 45 11 22 33 44 55 1234 2345 12345",
     ["1","2","3","4","5","Space"],
     "Left number reaches",
     ["Numbers row is FAR — biggest stretch on the keyboard",
      "Same finger as the column letter (1=pinky, 2=ring, etc.)",
      "Use Number Row, NOT numpad — numpad is a different skill"],
     {"anna": "Numbers stretch FAR up. Use the same finger as the column letter.",
      "maxim": "Numbers on the main row, not numpad. The latter is a different skill.",
      "knopych": "DIGITS! 🔢 1-2-3-4-5, same fingers as Q-W-E-R-T!",
      "klavochka": "Counting up to five, my dear — like steps! 🪜"},
     1, False, 8),

    (12, "Numbers row: 6-0 (right hand)",
     "Right hand numbers complete",
     36, "6 7 8 9 0 67 78 89 90 66 77 88 99 00 6789 7890 67890",
     ["6","7","8","9","0","Space"],
     "Right number reaches",
     ["6 with right index, 0 with right pinky",
      "Same finger logic as Y-U-I-O-P",
      "Numbers should flow as fast as letters by the end of the course"],
     {"anna": "Right side numbers — same finger as Y-U-I-O-P column.",
      "maxim": "All 10 digits now under your fingers. Time to mix them in.",
      "knopych": "FULL NUMERIC! 🔢 0-9 unlocked!",
      "klavochka": "Counting to ten, my star ⭐"},
     1, False, 8),

    (13, "Gaming words sprint",
     "Quick gaming/internet words at speed",
     37, "gg win play game level boss loot raid clan crew rank score chat ping lag pro mvp epic op meta",
     ["A-Z","Space"],
     "Gaming vocabulary",
     ["Gaming words = short, frequent, punchy",
      "If you game, these are muscle memory targets",
      "If you don't game, the rhythm still trains you"],
     {"anna": "Common gaming words. Short, punchy — perfect speed practice.",
      "maxim": "Even non-gamers benefit — short words train rhythm.",
      "knopych": "GAMER MODE ON! 🎮 GG NO RE!",
      "klavochka": "Words your gamer friends use, my dear 🎲"},
     1, False, 8),

    (14, "Punctuation basics: . , ? !",
     "End-of-sentence marks",
     38, "Hi! How are you? I'm great. Look at this. Wow! That's cool. Really? Yes, really. Wait, what? No way!",
     ["A-Z","Space",".",",","?","!"],
     "Period/comma/question/exclaim",
     ["Period and comma are home-row pinky (right)",
      "Question mark and exclaim need Shift",
      "Sentence-end punctuation is in 90% of writing"],
     {"anna": "Four essential punctuation marks. Together they cover most writing.",
      "maxim": "Punctuation is rhythm structure. Master it = master prose.",
      "knopych": "PUNCTUATION POWER! ✨ ? ! . , — all friends!",
      "klavochka": "Tiny dots and dashes, my dear — they give words life 💝"},
     1, False, 8),

    (15, "BLOCK 1 FINAL: Foundation test",
     "Teen Block 1 final — full alphabet + numbers + basic punctuation at 40 WPM",
     40, "Hey Sam! Are you free at 3 today? We're meeting at the cafe near school to plan the weekend trip. Bring snacks, your headphones, and 10 dollars. Don't be late!",
     ["A-Z","0-9","Shift",".",",","!","?","'","Space"],
     "Foundation gate — everything from Block 1",
     ["🎓 First milestone! 40 WPM = solid teen foundation",
      "From here, Block 2 builds speed and adds more punctuation",
      "If you missed by a few WPM, retry — accuracy first, speed second"],
     {"anna": "🎯 Teen Block 1 done! 40 WPM = strong start. Block 2 builds from here.",
      "maxim": "Foundation cleared. From here, every block is application + speed.",
      "knopych": "BLOCK 1 BOSS DEFEATED! 🐲🏆 Foundation mastery!",
      "klavochka": "First triumph, my hero! 🎉 Onto bigger adventures!"},
     1, False, 8),
]

# === KIDS BLOCK 1 (1-10) — Single keys + tiny words, very gentle ===
# Mentor: Klavochka (warm, encouraging, fairy-tale tone)
# Style: simple words, animals/colors/food themes, short repetitions
KIDS_B1 = [
    (1, "Hello! Letter A",
     "Your very first letter — A. Press it with your left pinky.",
     8, "a a a a a a a a a a",
     ["A"],
     "Left pinky finds A",
     ["Just one letter — letter A",
      "Use your LEFT little finger (pinky)",
      "Press gently, like a key on a piano"],
     {"anna": "Hello, little friend! Press A with your left pinky 🌸",
      "maxim": "First letter. Pinky finger. Gentle press.",
      "knopych": "Hi there! 🤖 Press A! That's it!",
      "klavochka": "Hello, my dear! 🌷 Just one letter today. Press A. Soft fingers!"},
     1, False, 10),

    (2, "Letter S",
     "Letter S — left ring finger",
     9, "s s s s s as as as sa sa sa ass",
     ["A","S"],
     "Left ring finger finds S",
     ["S is right next to A",
      "Use your left ring finger",
      "Try \"as\" and \"sa\" — your first tiny word!"],
     {"anna": "S is next to A. Try \"as\" — your first word! 🌸",
      "maxim": "Two letters now. Tiny words possible.",
      "knopych": "S unlocked! Try 'as' — that's a real word! 🌟",
      "klavochka": "Two letters, two friends, my dear! Like A and S holding hands ✨"},
     1, False, 10),

    (3, "Letter D and the word 'sad'",
     "Letter D — left middle finger. Make the word 'sad'!",
     10, "d d d d ad ad ad da da da sad sad sad dad dad dad add add add",
     ["A","S","D"],
     "Left middle finger finds D",
     ["D is left middle finger",
      "Now you can make \"sad\", \"dad\", \"add\"",
      "Look at that — real words!"],
     {"anna": "Three letters! \"Sad\", \"dad\" — real words ✨",
      "maxim": "Three letters, four words. Fast progress.",
      "knopych": "WORDS! 🎉 sad, dad, add — you're a writer!",
      "klavochka": "Three little letters making words, my treasure 🌟 So clever!"},
     1, False, 10),

    (4, "Letter F and friends",
     "Letter F — your anchor key. Feel the little bump?",
     11, "f f f f fa fa fa af af af fad fad fad ass ass ass sad sad sad",
     ["A","S","D","F"],
     "Left index finger finds F — anchor!",
     ["F is your LEFT anchor — feel the bump under your finger",
      "Always come back to F",
      "Left hand is complete!"],
     {"anna": "F has a little bump. That's your anchor — always find it by feel 🌷",
      "maxim": "F-anchor. The most important key. Always find it without looking.",
      "knopych": "F = ANCHOR! 🎯 Feel the bump? That's your home!",
      "klavochka": "F is your home, my dear! Like a cozy pillow under your finger 🛌"},
     1, False, 10),

    (5, "Right hand starts: J",
     "Letter J — right index finger. Feel the OTHER bump!",
     11, "j j j j j ja ja ja aj aj aj jaja jaja jaja sad sad fad",
     ["A","S","D","F","J"],
     "Right index finger finds J",
     ["J is your RIGHT anchor — another bump!",
      "J and F are your two homes",
      "Right hand wakes up now"],
     {"anna": "J is your right anchor — bump on the other side! Two homes now 🌸",
      "maxim": "Two anchors: F (left) and J (right). Always find them by feel.",
      "knopych": "J = OTHER ANCHOR! 🎯 Both hands now have homes!",
      "klavochka": "Two cozy pillows, my dear — one for each hand 💕"},
     1, False, 10),

    (6, "Letters K and L",
     "Right middle and ring fingers — K and L",
     12, "k k k l l l ka ka ka la la la kal kal kal jak jak jak fall fall fall",
     ["A","S","D","F","J","K","L"],
     "Right middle + ring finger",
     ["K and L next to J",
      "Right middle finger = K, right ring = L",
      "More tiny words possible"],
     {"anna": "K and L. Two more friends. \"Fall\" is your new word 🌷",
      "maxim": "Six home-row keys. Real words appearing.",
      "knopych": "K + L UNLOCKED! 🎯 Six letters in your collection!",
      "klavochka": "Two new friends joined, my sunshine ☀️"},
     1, False, 10),

    (7, "Semicolon and a tiny sentence",
     "Right pinky — the semicolon. Make a sentence!",
     13, "; ; ; a sad lad; a fall; jak falls; dad asks;",
     ["A","S","D","F","J","K","L",";","Space"],
     "Right pinky + semicolons + spaces",
     ["Semicolon (;) is your right pinky's home",
      "Space bar with your thumb",
      "First sentence: \"a sad lad\""],
     {"anna": "First sentence ever! \"A sad lad\". You're writing 🌸",
      "maxim": "Real sentence. The first of many.",
      "knopych": "SENTENCE LEVEL UNLOCKED! 🎉 \"a sad lad\" — that's writing!",
      "klavochka": "A whole sentence, my treasure! 💖 Look at you!"},
     1, False, 10),

    (8, "Rhythm: home row words",
     "Repeat words with rhythm",
     14, "ask ask ask sad sad sad lad lad lad jak jak jak fall fall fall ask sad lad jak fall",
     ["A","S","D","F","J","K","L","Space"],
     "Home row rhythm",
     ["Same word three times = rhythm practice",
      "Like clapping along to a song",
      "Don't speed up — just stay steady"],
     {"anna": "Rhythm like a song — clap-clap-clap, type-type-type 🌷",
      "maxim": "Repetition + rhythm = muscle memory.",
      "knopych": "RHYTHM MODE! 🥁 Same word, same beat!",
      "klavochka": "Like a little song, my dear 🎵 Tap-tap-tap!"},
     1, True, 10),

    (9, "Animal words: cat, dog, fish",
     "First fun words — animals!",
     15, "cat cat cat dog dog dog fish fish fish bee bee bee ant ant ant cow cow cow",
     ["A-Z subset","Space"],
     "Animal-themed words",
     ["Animals are easy to picture — fun while you practice",
      "Each word repeated — keep the rhythm",
      "Reach to new letters carefully"],
     {"anna": "Animals! Cat, dog, fish — picture them while you type 🌸",
      "maxim": "Fun words help retention. Memory loves images.",
      "knopych": "ANIMAL ZOO! 🐱🐶🐟 Type and see them!",
      "klavochka": "All your animal friends, my sunshine 🐝🐮"},
     1, False, 10),

    (10, "KIDS BLOCK 1 FINAL: First letter test",
     "First milestone — type these short words at 18 WPM",
     18, "cat dog fish bee ant cow ask sad lad fall add jak dad",
     ["A-Z subset","Space"],
     "Home row + first sight words",
     ["🎓 First Kids milestone!",
      "18 WPM is great for a beginner",
      "Block 2 brings more letters and more fun words"],
     {"anna": "🎯 First milestone, little friend! You did it! 🌸",
      "maxim": "First block done. Solid foundation for a young typist.",
      "knopych": "BLOCK 1 DONE! 🎉 Tiny typist becomes Big Typist!",
      "klavochka": "My darling, you finished! 🎉🎉🎉 First star earned ⭐"},
     1, False, 10),
]


def write_lessons(tier, lessons, out_dir):
    for entry in lessons:
        num, title, desc, wpm, text, keys, focus, tips, char_tips, phase, rhythm, error_pct = entry
        lesson = build_lesson(tier, num, title, desc, wpm, text, keys, focus, tips, char_tips, phase, rhythm, error_pct)
        fp = out_dir / f'lesson_{num:02d}.json'
        with open(fp, 'w', encoding='utf-8') as f:
            json.dump(lesson, f, indent=2, ensure_ascii=False)
        print(f'  wrote {fp.relative_to(out_dir.parent.parent.parent)} ({lesson["text_length"]} chars, WPM {wpm})')


print('=== Teen Block 1 (15 lessons) ===')
write_lessons('en_teen', TEEN_B1, OUT_TEEN)

print('\n=== Kids Block 1 (10 lessons) ===')
write_lessons('en_kids', KIDS_B1, OUT_KIDS)

print(f'\nDone. {len(TEEN_B1)} teen + {len(KIDS_B1)} kids lessons generated.')
