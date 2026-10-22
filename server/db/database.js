const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Initial seed data
const initialData = {
  users: [],
  trials: [],
  subscriptions: [],
  lessons: [
    // BEGINNER PATHWAY (10 topics)
    {
      id: 'beg-1',
      level: 'Beginner',
      order: 1,
      title: 'Alphabet & Spoken Word Foundations',
      description: 'Master core English phonetics, vowels, consonants, and everyday basic words.',
      estimatedMinutes: 15,
      content: {
        summary: 'English has 26 letters: 5 vowels (A, E, I, O, U) and 21 consonants. Vowel sounds shape the way we speak words clearly. Common mistake: pronouncing silent letters or rushing consonant clusters.',
        rules: [
          'Vowels create open mouth sounds (cat, bed, sit, top, cup).',
          'Consonant blends require clear articulation (st, pl, gr, cl).',
          'Always pronounce the final sound of a word clearly so listeners understand you easily.'
        ],
        examples: [
          { english: 'Good morning, how are you today?', kannada: 'ಶುಭೋದಯ, ನೀವು ಇಂದು ಹೇಗಿದ್ದೀರಿ?', note: 'Polite everyday morning greeting' },
          { english: 'My name is Rahul and I am from Bengaluru.', kannada: 'ನನ್ನ ಹೆಸರು ರಾಹುಲ್ ಮತ್ತು ನಾನು ಬೆಂಗಳೂರಿನವನು.', note: 'Introducing yourself simply' }
        ],
        practicePrompts: [
          'Say: "Pleasure to meet you, my friend."',
          'Spell your name aloud using clear vowel sounds.'
        ],
        quiz: [
          {
            q: 'Which letters in English are vowels?',
            options: ['A, E, I, O, U', 'B, C, D, F, G', 'X, Y, Z', 'S, T, R, P'],
            answer: 0,
            explanation: 'The 5 English vowels are A, E, I, O, and U. They provide the core vocal sounds in English syllables.'
          }
        ]
      }
    },
    {
      id: 'beg-2',
      level: 'Beginner',
      order: 2,
      title: 'Nouns and Pronouns in Daily Life',
      description: 'Learn how to refer to people, places, objects, and how to replace nouns with pronouns without confusion.',
      estimatedMinutes: 20,
      content: {
        summary: 'A noun is a naming word (person, place, thing, idea). A pronoun replaces a noun so we do not repeat it awkwardly (I, you, he, she, it, we, they).',
        rules: [
          'Use "He" for a male person, "She" for a female person, and "It" for objects or non-human subjects.',
          'Use "They" for multiple people or gender-neutral singular references.',
          'Possessive pronouns: My, your, his, her, their, our (e.g., "This is my book").'
        ],
        examples: [
          { english: 'Pooja is a teacher. She loves teaching English.', kannada: 'ಪೂಜಾ ಶಿಕ್ಷಕಿ. ಅವಳು ಇಂಗ್ಲಿಷ್ ಕಲಿಸಲು ಇಷ್ಟಪಡುತ್ತಾಳೆ.', note: '"She" replaces "Pooja"' },
          { english: 'This is my laptop. It is very fast.', kannada: 'ಇದು ನನ್ನ ಲ್ಯಾಪ್‌ಟಾಪ್. ಇದು ತುಂಬಾ ವೇಗವಾಗಿದೆ.', note: '"It" replaces "laptop"' }
        ],
        practicePrompts: [
          'Substitute pronouns: "Anand and Meena went to the library."',
          'Talk about your best friend using "He" or "She".'
        ],
        quiz: [
          {
            q: 'Which pronoun should replace "My sister" in: "My sister lives in Mysuru. ___ is a doctor."',
            options: ['He', 'She', 'It', 'They'],
            answer: 1,
            explanation: '"She" is the correct singular feminine subject pronoun for "My sister".'
          }
        ]
      }
    },
    {
      id: 'beg-3',
      level: 'Beginner',
      order: 3,
      title: 'Action Verbs and Vivid Adjectives',
      description: 'Express what you do and describe feelings, things, and people with confidence.',
      estimatedMinutes: 20,
      content: {
        summary: 'Verbs are action words (run, speak, learn, create, listen). Adjectives describe nouns (friendly, quick, bright, confident, nervous).',
        rules: [
          'Adjectives usually come BEFORE the noun: "a friendly teacher", "a confident speaker".',
          'Verbs must agree with their subject: "I speak", but "He speaks" (add -s for 3rd person singular in present simple).'
        ],
        examples: [
          { english: 'She speaks English with great confidence.', kannada: 'ಅವಳು ಉತ್ತಮ ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಇಂಗ್ಲಿಷ್ ಮಾತನಾಡುತ್ತಾಳೆ.', note: 'Verb: speaks, Adjective: great' },
          { english: 'We learn new words every morning.', kannada: 'ನಾವು ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಹೊಸ ಪದಗಳನ್ನು ಕಲಿಯುತ್ತೇವೆ.', note: 'Verb: learn, Adjective: new' }
        ],
        practicePrompts: [
          'Describe your city using 3 positive adjectives.',
          'Name 5 action verbs you performed today.'
        ],
        quiz: [
          {
            q: 'Find the adjective in the sentence: "Arjeevi is a patient mentor."',
            options: ['Arjeevi', 'is', 'patient', 'mentor'],
            answer: 2,
            explanation: '"Patient" is an adjective that describes the noun "mentor".'
          }
        ]
      }
    },
    {
      id: 'beg-4',
      level: 'Beginner',
      order: 4,
      title: 'Articles: A, An, and The',
      description: 'Stop guessing articles. Know exactly when to use "a", "an", and "the".',
      estimatedMinutes: 15,
      content: {
        summary: '"A" and "An" are indefinite articles used with singular countable nouns. "The" is the definite article used when referring to a specific item known to both speaker and listener.',
        rules: [
          'Use "A" before consonant SOUNDS: a book, a university (starts with "yoo" sound), a car.',
          'Use "An" before vowel SOUNDS: an apple, an honest person ("h" is silent), an hour.',
          'Use "The" for unique or specific things: The sun, the Taj Mahal, the book you gave me.'
        ],
        examples: [
          { english: 'I saw an eagle in the park.', kannada: 'ನಾನು ಉದ್ಯಾನದಲ್ಲಿ ಒಂದು ಗಿಡುಗವನ್ನು ನೋಡಿದೆ.', note: '"an eagle" (vowel sound), "the park" (specific)' },
          { english: 'He is an honest police officer.', kannada: 'ಅವರು ಪ್ರಾಮಾಣಿಕ ಪೊಲೀಸ್ ಅಧಿಕಾರಿ.', note: '"an" before silent h in "honest"' }
        ],
        practicePrompts: [
          'Practice: "___ umbrella", "___ university", "___ European country".'
        ],
        quiz: [
          {
            q: 'Choose the correct article: "She waited for ___ hour at the bus stand."',
            options: ['a', 'an', 'the', 'no article needed'],
            answer: 1,
            explanation: '"Hour" begins with a vowel sound (/aʊər/), because the "h" is silent. Hence, use "an".'
          }
        ]
      }
    },
    {
      id: 'beg-5',
      level: 'Beginner',
      order: 5,
      title: 'Prepositions of Time and Place (In, On, At)',
      description: 'Never get confused about whether to say "in Monday" or "on Monday" again.',
      estimatedMinutes: 20,
      content: {
        summary: 'Prepositions connect nouns or pronouns to other words in the sentence. For time and place: AT is for specific points, ON is for surfaces and days, IN is for enclosed spaces and long time periods.',
        rules: [
          'Time: AT 5:00 PM (specific time); ON Monday (day/date); IN 2026, IN October (months, years, seasons).',
          'Place: AT the bus stop (specific point); ON the table (surface); IN the room, IN Bengaluru (enclosed space, city, country).'
        ],
        examples: [
          { english: 'Our live speaking club starts at 7:00 PM on Friday.', kannada: 'ನಮ್ಮ ಲೈವ್ ಸ್ಪೀಕಿಂಗ್ ಕ್ಲಬ್ ಶುಕ್ರವಾರ ಸಂಜೆ 7:00 ಗಂಟೆಗೆ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.', note: '"at 7:00 PM", "on Friday"' },
          { english: 'I live in Karnataka, India.', kannada: 'ನಾನು ಭಾರತದ ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೇನೆ.', note: '"in" for state/country' }
        ],
        practicePrompts: [
          'Fill in: "I was born ___ May ___ 10:00 AM ___ a Sunday."',
          'Tell the AI Teacher where you are sitting right now using AT, ON, and IN.'
        ],
        quiz: [
          {
            q: 'Which preposition fits: "The weekly English debate takes place ___ Saturday morning."',
            options: ['in', 'on', 'at', 'by'],
            answer: 1,
            explanation: 'We use the preposition "on" for days of the week and specific days.'
          }
        ]
      }
    },
    {
      id: 'beg-6',
      level: 'Beginner',
      order: 6,
      title: 'Basic Sentence Structure (Subject + Verb + Object)',
      description: 'The golden formula for confident English sentence construction without hesitation.',
      estimatedMinutes: 20,
      content: {
        summary: 'Standard English word order follows S-V-O: Subject (who/what) + Verb (action) + Object (receiver of action).',
        rules: [
          'Start with the Subject: "Ravi..."',
          'Follow with the Verb: "...reads..."',
          'Complete with the Object/Complement: "...the morning newspaper."',
          'Do not omit the subject in English (unlike some Indian languages where subject can be dropped).'
        ],
        examples: [
          { english: 'Arjun drinks warm water every morning.', kannada: 'ಅರ್ಜುನ್ ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಬಿಸಿ ನೀರು ಕುಡಿಯುತ್ತಾನೆ.', note: 'Subject: Arjun, Verb: drinks, Object: warm water' },
          { english: 'We practice English conversation together.', kannada: 'ನಾವು ಒಟ್ಟಿಗೆ ಇಂಗ್ಲಿಷ್ ಸಂಭಾಷಣೆಯನ್ನು ಅಭ್ಯಾಸ ಮಾಡುತ್ತೇವೆ.', note: 'S: We, V: practice, O: English conversation' }
        ],
        practicePrompts: [
          'Arrange: "books / reading / enjoys / she"',
          'Speak a simple S-V-O sentence about your favorite hobby.'
        ],
        quiz: [
          {
            q: 'Which sentence correctly follows Subject + Verb + Object order?',
            options: [
              'Likes cricket deepak very much.',
              'Deepak cricket likes very much.',
              'Deepak likes cricket very much.',
              'Very much cricket Deepak likes.'
            ],
            answer: 2,
            explanation: '"Deepak" (Subject) + "likes" (Verb) + "cricket" (Object) follows the standard S-V-O order.'
          }
        ]
      }
    },
    {
      id: 'beg-7',
      level: 'Beginner',
      order: 7,
      title: 'Mastering Present, Past, and Future Tenses',
      description: 'Talk smoothly about your daily routine, yesterday\'s events, and tomorrow\'s plans.',
      estimatedMinutes: 25,
      content: {
        summary: 'Tenses locate actions in time: Present Simple (habits/facts), Past Simple (completed actions), Future Simple (intentions/predictions).',
        rules: [
          'Present: "I study every evening." / "He studies every evening."',
          'Past: "I studied yesterday." (regular verbs add -ed; irregular verbs change: eat -> ate, speak -> spoke, go -> went).',
          'Future: "I will study tomorrow."'
        ],
        examples: [
          { english: 'Yesterday, I spoke with a partner for 15 minutes.', kannada: 'ನಿನ್ನೆ, ನಾನು 15 ನಿಮಿಷಗಳ ಕಾಲ ಪಾಲುದಾರರೊಂದಿಗೆ ಮಾತನಾಡಿದೆ.', note: 'Past tense of speak is spoke' },
          { english: 'Tomorrow, I will participate in the Quiz Arena.', kannada: 'ನಾಳೆ, ನಾನು ರಸಪ್ರಶ್ನೆ ಅರೆನಾದಲ್ಲಿ ಭಾಗವಹಿಸುತ್ತೇನೆ.', note: 'Future tense using will' }
        ],
        practicePrompts: [
          'Say what you ate for lunch yesterday (Past).',
          'Say what you will do tomorrow morning (Future).'
        ],
        quiz: [
          {
            q: 'Choose the correct past tense form: "Last Sunday, they ___ to the tech seminar."',
            options: ['go', 'went', 'gone', 'going'],
            answer: 1,
            explanation: '"Went" is the past simple form of the irregular verb "go".'
          }
        ]
      }
    },
    {
      id: 'beg-8',
      level: 'Beginner',
      order: 8,
      title: 'Essential Spoken Vocabulary & Connectors',
      description: 'Expand your word bank with conversational transition words: because, although, however, therefore.',
      estimatedMinutes: 20,
      content: {
        summary: 'Vocabulary is your toolbox. Connectors link short sentences into fluent, natural speech.',
        rules: [
          'Use "because" to state reasons: "I practice daily because I want a promotion."',
          'Use "but" or "however" to show contrast: "I was shy, but now I speak freely."',
          'Use "and" to add information: "I read books and watch educational videos."'
        ],
        examples: [
          { english: 'I want to speak fluently because it helps my career.', kannada: 'ನಾನು ನಿರರ್ಗಳವಾಗಿ ಮಾತನಾಡಲು ಬಯಸುತ್ತೇನೆ ಏಕೆಂದರೆ ಇದು ನನ್ನ ವೃತ್ತಿಜೀವನಕ್ಕೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.', note: '"because" introduces the reason' }
        ],
        practicePrompts: [
          'Join: "English is challenging." + "I enjoy learning it every day."'
        ],
        quiz: [
          {
            q: 'Which connector shows a contrast?',
            options: ['Because', 'And', 'Although', 'So'],
            answer: 2,
            explanation: '"Although" introduces a contrast or concession between two clauses.'
          }
        ]
      }
    },
    {
      id: 'beg-9',
      level: 'Beginner',
      order: 9,
      title: 'Everyday Questions & Polite Answers',
      description: 'Ask WH- questions (What, Where, When, Why, Who, How) and respond with polite warmth.',
      estimatedMinutes: 20,
      content: {
        summary: 'Mastering question formation is the secret to initiating natural conversations with peers and interviewers.',
        rules: [
          'WH-Question formula: Question Word + Auxiliary Verb + Subject + Main Verb? ("Where do you live?")',
          'Polite responses: Start with "Certainly", "I would be glad to", or "Thank you for asking".'
        ],
        examples: [
          { english: 'Could you please repeat that slowly?', kannada: 'ದಯವಿಟ್ಟು ಅದನ್ನು ನಿಧಾನವಾಗಿ ಪುನರಾವರ್ತಿಸಬಹುದೇ?', note: 'Polite request when you missed a sentence' },
          { english: 'What do you enjoy doing on weekends?', kannada: 'ವಾರಾಂತ್ಯದಲ್ಲಿ ನೀವು ಏನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?', note: 'Friendly open-ended question' }
        ],
        practicePrompts: [
          'Ask your partner about their current job or college.',
          'Practice asking someone for directions to the train station.'
        ],
        quiz: [
          {
            q: 'Which is the most grammatically correct question?',
            options: [
              'Where you are working currently?',
              'Where do you work currently?',
              'Where are working you currently?',
              'Where work you currently?'
            ],
            answer: 1,
            explanation: '"Where do you work currently?" follows WH-word + auxiliary "do" + subject "you" + base verb "work".'
          }
        ]
      }
    },
    {
      id: 'beg-10',
      level: 'Beginner',
      order: 10,
      title: 'Basic Spoken English & Overcoming Fear',
      description: 'Mindset shifts, breathing techniques, and practical scripts to silence your fear of speaking.',
      estimatedMinutes: 25,
      content: {
        summary: 'The biggest barrier to speaking English is not lack of grammar — it is fear of judgment. Everyone makes mistakes when learning. Speaking with errors is 100x better than staying silent!',
        rules: [
          'Speak slowly: Rushing causes hesitation and stuttering.',
          'Pause with confidence: It is okay to pause for 2 seconds to formulate your thought.',
          'Smile: Smiling relaxes your vocal cords and creates instant rapport with your conversation partner.'
        ],
        examples: [
          { english: 'Please excuse my mistake, let me rephrase that.', kannada: 'ದಯವಿಟ್ಟು ನನ್ನ ತಪ್ಪನ್ನು ಕ್ಷಮಿಸಿ, ನಾನು ಅದನ್ನು ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಹೇಳುತ್ತೇನೆ.', note: 'Confident recovery phrase' },
          { english: 'I am practicing my spoken English, and I appreciate your patience.', kannada: 'ನಾನು ನನ್ನ ಮಾತನಾಡುವ ಇಂಗ್ಲಿಷ್ ಅನ್ನು ಅಭ್ಯಾಸ ಮಾಡುತ್ತಿದ್ದೇನೆ ಮತ್ತು ನಿಮ್ಮ ತಾಳ್ಮೆಯನ್ನು ನಾನು ಪ್ರಶಂಸಿಸುತ್ತೇನೆ.', note: 'Disarming honesty that builds goodwill' }
        ],
        practicePrompts: [
          'Record yourself speaking for 60 seconds about your dream job.',
          'Step into the "Speak with People" peer room and say your first greeting!'
        ],
        quiz: [
          {
            q: 'What is the best reaction when you realize you made a grammar mistake while speaking?',
            options: [
              'Stop talking immediately and leave the room.',
              'Feel embarrassed and switch back to silence.',
              'Smile, calmly rephrase your sentence, and keep speaking.',
              'Pretend you did not say anything.'
            ],
            answer: 2,
            explanation: 'Calmly correcting or rephrasing with a smile shows true conversational maturity and confidence.'
          }
        ]
      }
    },

    // INTERMEDIATE PATHWAY (9 topics)
    {
      id: 'int-1',
      level: 'Intermediate',
      order: 1,
      title: 'Sentence Expansion & Descriptive Flow',
      description: 'Transform basic 4-word sentences into rich, compelling expressions with relative clauses.',
      estimatedMinutes: 25,
      content: {
        summary: 'Instead of saying "I have a car. It is blue. It is fast.", learn to say "I drive a fast blue car that saves fuel efficiently."',
        rules: [
          'Use relative pronouns: who (for people), which/that (for things), where (for places).',
          'Use participial phrases: "Walking into the office, she greeted her team with a smile."'
        ],
        examples: [
          { english: 'The engineer who solved the critical bug received a standing ovation.', kannada: 'ಕ್ಲಿಷ್ಟಕರ ದೋಷವನ್ನು ಪರಿಹರಿಸಿದ ಎಂಜಿನಿಯರ್‌ಗೆ ಎದ್ದುನಿಂತು ಗೌರವ ಸಲ್ಲಿಸಲಾಯಿತು.' }
        ],
        quiz: [
          {
            q: 'Combine: "This is the company. I worked here for three years."',
            options: [
              'This is the company where I worked for three years.',
              'This is the company which I worked for three years.',
              'This is the company who I worked for three years.',
              'This is the company what I worked for three years.'
            ],
            answer: 0,
            explanation: '"Where" refers to a place or workplace.'
          }
        ]
      }
    },
    {
      id: 'int-2',
      level: 'Intermediate',
      order: 2,
      title: 'Conditionals (Zero, First, Second & Third)',
      description: 'Master "If" clauses for hypothetical scenarios, career plans, and professional advice.',
      estimatedMinutes: 25,
      content: {
        summary: 'Conditionals express cause and effect across reality and imagination.',
        rules: [
          'Zero: If you heat water, it boils (scientific truth).',
          'First: If I practice today, I will speak better tomorrow (real possibility).',
          'Second: If I had more time, I would learn a third language (hypothetical present).',
          'Third: If I had prepared earlier, I would have cleared the test (past regret).'
        ],
        examples: [
          { english: 'If we prepare our slides thoroughly, the client will be impressed.', kannada: 'ನಾವು ನಮ್ಮ ಸ್ಲೈಡ್‌ಗಳನ್ನು ಸಮಗ್ರವಾಗಿ ಸಿದ್ಧಪಡಿಸಿದರೆ, ಕ್ಲೈಂಟ್ ಪ್ರಭಾವಿತರಾಗುತ್ತಾರೆ.' }
        ],
        quiz: [
          {
            q: 'Complete: "If I ___ you, I would accept the job offer immediately."',
            options: ['am', 'was', 'were', 'have been'],
            answer: 2,
            explanation: 'In the second conditional (hypothetical present), "were" is standard for all subjects ("If I were you").'
          }
        ]
      }
    },
    {
      id: 'int-3',
      level: 'Intermediate',
      order: 3,
      title: 'Active vs. Passive Voice in Professional Writing',
      description: 'Know when to highlight the action instead of the person in emails and reports.',
      estimatedMinutes: 20,
      content: {
        summary: 'Active voice is direct and energetic ("Arjun wrote the report"). Passive voice is objective and formal ("The report was written by Arjun" or "The invoice has been paid").',
        rules: [
          'Use Active voice for clear communication, leadership, and storytelling.',
          'Use Passive voice when the actor is unknown, obvious, or when delivering diplomatic bad news: "An error was detected in the invoice."'
        ],
        examples: [
          { english: 'All meeting notes were sent to the attendees yesterday.', kannada: 'ನಿನ್ನೆ ಎಲ್ಲಾ ಸಭೆಯ ಟಿಪ್ಪಣಿಗಳನ್ನು ಭಾಗವಹಿಸಿದವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.' }
        ],
        quiz: [
          {
            q: 'Identify the passive sentence:',
            options: [
              'The team launched the software yesterday.',
              'The software was launched by the team yesterday.',
              'The team will celebrate the launch.',
              'The software performs exceptionally well.'
            ],
            answer: 1,
            explanation: '"The software was launched by the team" puts the receiver of the action in the subject position with form of "be" + past participle.'
          }
        ]
      }
    },

    // ADVANCED PATHWAY (8 topics)
    {
      id: 'adv-1',
      level: 'Advanced',
      order: 1,
      title: 'Nuanced Rhetoric & Persuasive Speaking',
      description: 'Use ethos, pathos, logos, and rhetorical cadence to move an audience and win debates.',
      estimatedMinutes: 30,
      content: {
        summary: 'Persuasion is the highest form of language mastery. It combines factual evidence (logos), personal credibility (ethos), and emotional resonance (pathos).',
        rules: [
          'The Rule of Three (Tricolon): Grouping points in triads creates rhythm ("Clear, concise, and compelling").',
          'Contrast and Antithesis: Juxtapose opposing ideas ("Not because it is easy, but because it is necessary").',
          'Modality for diplomacy: Use subtle modals (might, could, appears to) rather than dogmatic assertions.'
        ],
        examples: [
          { english: 'We do not seek comfort in the familiar; we seek growth in the challenging.', kannada: 'ನಾವು ಪರಿಚಿತತೆಯಲ್ಲಿ ಸೌಕರ್ಯವನ್ನು ಹುಡುಕುವುದಿಲ್ಲ; ನಾವು ಸವಾಲಿನಲ್ಲಿ ಬೆಳವಣಿಗೆಯನ್ನು ಬಯಸುತ್ತೇವೆ.' }
        ],
        quiz: [
          {
            q: 'Which rhetorical device is used in "Government of the people, by the people, for the people"?',
            options: ['Metaphor', 'Tricolon / Rule of Three', 'Alliteration', 'Hyperbole'],
            answer: 1,
            explanation: 'A tricolon is a rhetorical term for a series of three parallel words, phrases, or clauses.'
          }
        ]
      }
    },
    {
      id: 'adv-2',
      level: 'Advanced',
      order: 2,
      title: 'Corporate Executive Communication & Boardroom Presence',
      description: 'Speak like an industry leader: conciseness, BLUF (Bottom Line Up Front), and executive presence.',
      estimatedMinutes: 30,
      content: {
        summary: 'Senior executives do not have time for winding preambles. State your conclusion or recommendation first, follow with 2-3 data points, and outline the decision needed.',
        rules: [
          'BLUF Framework: Bottom Line Up Front.',
          'Eliminate filler qualifiers: Avoid "I just wanted to check if maybe..." -> Replace with "I recommend we proceed with..."',
          'Handle interruptions with poise: "Allow me to complete this crucial metric, and I will gladly address your question."'
        ],
        examples: [
          { english: 'To increase team velocity by 25%, I recommend migrating to automated CI/CD pipelines this quarter.', kannada: 'ತಂಡದ ಕೆಲಸದ ವೇಗವನ್ನು 25% ಹೆಚ್ಚಿಸಲು, ಈ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತ CI/CD ಪೈಪ್‌ಲೈನ್‌ಗಳಿಗೆ ಪರಿವರ್ತನೆಯಾಗಲು ನಾನು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.' }
        ],
        quiz: [
          {
            q: 'What does the executive communication acronym BLUF stand for?',
            options: [
              'Business Leadership Under Focus',
              'Bottom Line Up Front',
              'Brief Layout Using Facts',
              'Board Level Urgent Feedback'
            ],
            answer: 1,
            explanation: 'BLUF stands for "Bottom Line Up Front" — stating the most critical insight or decision right at the start.'
          }
        ]
      }
    }
  ],
  fillInBlanks: [
    {
      id: 'fib-1',
      difficulty: 'Beginner',
      sentence: 'The sun rises in the ____ and sets in the west.',
      options: ['east', 'north', 'south', 'ground'],
      answer: 'east',
      explanation: 'In English and geography, the sun always rises in the east.'
    },
    {
      id: 'fib-2',
      difficulty: 'Beginner',
      sentence: 'She ____ to the English learning club every Wednesday.',
      options: ['go', 'goes', 'going', 'wenting'],
      answer: 'goes',
      explanation: 'With third-person singular subjects (he, she, it) in the simple present tense, add "-s" or "-es" to the verb (go -> goes).'
    },
    {
      id: 'fib-3',
      difficulty: 'Beginner',
      sentence: 'Can you please lend me ____ pencil for the lecture?',
      options: ['a', 'an', 'the', 'some'],
      answer: 'a',
      explanation: '"Pencil" is a singular countable noun starting with a consonant sound, so we use the indefinite article "a".'
    },
    {
      id: 'fib-4',
      difficulty: 'Intermediate',
      sentence: 'She has been working at this software company ____ 2024.',
      options: ['since', 'for', 'from', 'in'],
      answer: 'since',
      explanation: 'Use "since" with a specific starting point in time (since 2024, since morning). Use "for" with a duration of time (for 2 years).'
    },
    {
      id: 'fib-5',
      difficulty: 'Intermediate',
      sentence: 'Neither the manager nor the team members ____ available for the demo.',
      options: ['was', 'were', 'is', 'are being'],
      answer: 'were',
      explanation: 'With "neither... nor...", the verb agrees with the subject closer to it. "Team members" is plural, so we use "were".'
    },
    {
      id: 'fib-6',
      difficulty: 'Advanced',
      sentence: 'Had I known about the emergency meeting, I ____ attended without hesitation.',
      options: ['would have', 'will have', 'would had', 'had'],
      answer: 'would have',
      explanation: 'Inverted third conditional structure ("Had I known...") requires "would have" + past participle in the result clause.'
    },
    {
      id: 'fib-7',
      difficulty: 'Advanced',
      sentence: 'The board recommended that the project ____ postponed until Q4.',
      options: ['be', 'is', 'was', 'were'],
      answer: 'be',
      explanation: 'English subjunctive mood following verbs of urging or recommending (recommend, suggest, insist) uses the base verb form ("be").'
    }
  ],
  sentenceBuilder: [
    {
      id: 'sb-1',
      difficulty: 'Beginner',
      targetSentence: 'She speaks English with great confidence.',
      shuffledWords: ['speaks', 'confidence.', 'with', 'She', 'English', 'great'],
      explanation: 'Subject ("She") + Verb ("speaks") + Object ("English") + Prepositional phrase ("with great confidence.").'
    },
    {
      id: 'sb-2',
      difficulty: 'Beginner',
      targetSentence: 'We practice conversation every single day.',
      shuffledWords: ['single', 'We', 'every', 'practice', 'day.', 'conversation'],
      explanation: 'Subject ("We") + Verb ("practice") + Object ("conversation") + Time expression ("every single day.").'
    },
    {
      id: 'sb-3',
      difficulty: 'Intermediate',
      targetSentence: 'Although he was nervous, he delivered an inspiring presentation.',
      shuffledWords: ['an', 'nervous,', 'inspiring', 'Although', 'delivered', 'he', 'was', 'presentation.', 'he'],
      explanation: 'Concessive clause ("Although he was nervous") followed by the main clause ("he delivered an inspiring presentation.").'
    },
    {
      id: 'sb-4',
      difficulty: 'Advanced',
      targetSentence: 'Under no circumstances should you disclose confidential user credentials.',
      shuffledWords: ['you', 'Under', 'circumstances', 'confidential', 'no', 'disclose', 'user', 'should', 'credentials.'],
      explanation: 'Negative inversion: Negative adverbial ("Under no circumstances") + auxiliary ("should") + subject ("you") + main verb ("disclose").'
    }
  ],
  weeklyQuizzes: [
    {
      id: 'wq-2026-w43',
      title: 'Weekly Grand English Championship — Spoken Fluency & Grammar Arena',
      topic: 'Everyday Idioms, Professional Tenses & Conversational Etiquette',
      startTime: '2026-10-19T00:00:00.000Z',
      endTime: '2026-10-26T23:59:59.000Z',
      durationMinutes: 10,
      totalQuestions: 5,
      questions: [
        {
          id: 'q1',
          question: 'What does the common idiom "break the ice" mean in a conversation?',
          options: [
            'To make people feel more comfortable and start talking',
            'To drink iced coffee during a discussion',
            'To interrupt an argument angrily',
            'To end a speaking call abruptly'
          ],
          answer: 0,
          explanation: '"To break the ice" means to do or say something that relieves tension and initiates friendly conversation with strangers.'
        },
        {
          id: 'q2',
          question: 'Which of the following is the most polite way to disagree during an interview or debate?',
          options: [
            'You are completely wrong about that.',
            'I see your perspective, however, another angle to consider is...',
            'That makes no sense whatsoever.',
            'No, that is not true.'
          ],
          answer: 1,
          explanation: 'Acknowledging the other speaker\'s perspective before offering an alternative view ("I see your perspective, however...") is the cornerstone of diplomatic communication.'
        },
        {
          id: 'q3',
          question: 'Choose the correct sentence:',
          options: [
            'Each of the students have submitted their project.',
            'Each of the students has submitted their project.',
            'Each of the students are submitting their project.',
            'Each of the student have submitted their project.'
          ],
          answer: 1,
          explanation: '"Each" is a singular distributive pronoun and takes a singular verb ("has submitted").'
        },
        {
          id: 'q4',
          question: 'In spoken English, what is the best reply when someone says "Thank you so much for your assistance!"?',
          options: [
            'It was my pleasure! Happy to help anytime.',
            'Yes, I know I helped.',
            'You owe me one.',
            'Okay fine.'
          ],
          answer: 0,
          explanation: '"It was my pleasure! Happy to help anytime" is warm, professional, and gracious.'
        },
        {
          id: 'q5',
          question: 'Which word describes a person who speaks multiple languages fluently?',
          options: ['Omniscient', 'Polyglot', 'Benefactor', 'Philosopher'],
          answer: 1,
          explanation: 'A polyglot is someone who knows and speaks several languages.'
        }
      ],
      leaderboard: [
        { rank: 1, name: 'Ananya S.', score: 100, timeSeconds: 142, date: '2026-10-20' },
        { rank: 2, name: 'Karthik Gowda', score: 100, timeSeconds: 168, date: '2026-10-21' },
        { rank: 3, name: 'Priya Raman', score: 80, timeSeconds: 195, date: '2026-10-21' }
      ]
    }
  ],
  debateTopics: [
    {
      id: 'deb-1',
      title: 'Is AI Replacing or Augmenting Human Creativity and Jobs?',
      category: 'Technology & Society',
      description: 'Explore the fast-evolving balance between machine intelligence and irreplaceable human empathy, nuance, and innovation.',
      rules: [
        'Round 1 (60s): Proposition presents primary opening arguments.',
        'Round 2 (60s): Opposition presents rebuttal and counter-arguments.',
        'Round 3 (45s each): Cross-examination and open discussion.',
        'Round 4 (30s each): Closing summary and learning reflections.'
      ],
      propositionPoints: [
        'AI automates repetitive tasks, freeing humans to solve creative, strategic problems.',
        'New industries, prompt engineers, and ethical curators are emerging worldwide.',
        'Historically, every technological leap (electricity, internet) created more jobs than it replaced.'
      ],
      oppositionPoints: [
        'Rapid dislocation in entry-level coding, writing, and design hurts junior career entry.',
        'Wealth concentration among a few AI monopolies risks deepening societal inequality.',
        'Over-reliance on automated models may erode genuine critical thinking and authentic expression.'
      ],
      suggestedVocabulary: ['Augmentation', 'Disruption', 'Cognitive burden', 'Paradigm shift', 'Unprecedented']
    },
    {
      id: 'deb-2',
      title: 'Should Remote Work be Considered a Fundamental Workplace Right?',
      category: 'Career & Work Culture',
      description: 'Examine work-life balance, global talent accessibility, and productivity versus in-person camaraderie and spontaneous team innovation.',
      rules: [
        'Round 1: Opening arguments (60s)',
        'Round 2: Rebuttal (60s)',
        'Round 3: Open dialogue & closing notes'
      ],
      propositionPoints: [
        'Eliminates soul-draining traffic commutes, reducing mental fatigue and pollution.',
        'Democratizes job opportunities for talent living in tier-2 and tier-3 towns.',
        'Empowers parents and caregivers to sustain long-term productive careers.'
      ],
      oppositionPoints: [
        'Spontaneous corridor discussions and creative mentorship are harder in virtual calls.',
        'Blurry boundaries between home and office often lead to silent professional burnout.',
        'Certain hands-on roles, laboratory work, and collaborative physical crafts require presence.'
      ],
      suggestedVocabulary: ['Asynchronous', 'Commute', 'Autonomy', 'Proximity bias', 'Work-life integration']
    }
  ],
  peerCallLogs: [],
  blockedPairs: [],
  userReports: [],
  certificates: [],
  securityEvents: [],
  passwordResetTokens: []
};

// Ensure data directory exists
function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    // Seed default admin user
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ArjeeviAdmin2026!', salt);

    const seededData = {
      ...initialData,
      users: [
        {
          id: 'usr-admin-001',
          email: process.env.ADMIN_EMAIL || 'admin@arjeevi.com',
          passwordHash: adminPasswordHash,
          name: 'Arjeevi Admin',
          preferredName: 'Arjeevi Admin',
          role: 'admin',
          age: 30,
          currentLevel: 'Advanced',
          goals: ['Public speaking', 'IT and software careers', 'Business and entrepreneurship'],
          confidenceLevel: 'I want to become fluent and professional.',
          explanationLanguage: 'English + Kannada',
          dailyGoalMinutes: 30,
          onboardingCompleted: true,
          streak: 15,
          lastActiveDate: new Date().toISOString().split('T')[0],
          lessonsCompleted: ['beg-1', 'beg-2', 'beg-3', 'beg-4', 'beg-5', 'beg-6'],
          grammarScore: 95,
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr-demo-learner',
          email: 'learner@arjeevi.com',
          passwordHash: bcrypt.hashSync('Learner2026!', salt),
          name: 'Pavan Kumar',
          preferredName: 'Pavan',
          role: 'learner',
          age: 22,
          currentLevel: 'Beginner',
          goals: ['Everyday conversation', 'Job interviews'],
          confidenceLevel: 'I am afraid to speak.',
          explanationLanguage: 'Kannada',
          dailyGoalMinutes: 15,
          onboardingCompleted: true,
          streak: 5,
          lastActiveDate: new Date().toISOString().split('T')[0],
          lessonsCompleted: ['beg-1', 'beg-2'],
          grammarScore: 70,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      trials: [
        {
          userId: 'usr-demo-learner',
          trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          isTrialActive: true,
          consistencyBonusDays: 0,
          bonusHistory: []
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seededData, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
}

function writeDb(data) {
  const content = JSON.stringify(data, null, 2);
  const tmpPath = `${DB_PATH}.tmp`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf-8');
    try {
      fs.renameSync(tmpPath, DB_PATH);
    } catch (renameErr) {
      // Windows / OneDrive file locks can cause EPERM/EBUSY on atomic rename
      fs.writeFileSync(DB_PATH, content, 'utf-8');
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(DB_PATH, content, 'utf-8');
      return true;
    } catch (directErr) {
      console.error('Error saving database:', directErr);
      return false;
    }
  }
}

// Database helper functions
const db = {
  read: readDb,
  write: writeDb,

  // Users
  getUserByEmail(email) {
    const data = readDb();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById(id) {
    const data = readDb();
    return data.users.find(u => u.id === id);
  },
  createUser(userData) {
    const data = readDb();
    data.users.push(userData);
    writeDb(data);
    return userData;
  },
  updateUser(id, updates) {
    const data = readDb();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      writeDb(data);
      return data.users[index];
    }
    return null;
  },

  // Trials
  getTrial(userId) {
    const data = readDb();
    return data.trials.find(t => t.userId === userId);
  },
  saveTrial(trialData) {
    const data = readDb();
    const index = data.trials.findIndex(t => t.userId === trialData.userId);
    if (index !== -1) {
      data.trials[index] = { ...data.trials[index], ...trialData };
    } else {
      data.trials.push(trialData);
    }
    writeDb(data);
    return trialData;
  },

  // Security Events
  logSecurityEvent(event) {
    const data = readDb();
    const newEvent = {
      id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      resolved: false,
      ...event
    };
    data.securityEvents.unshift(newEvent);
    // Keep last 1000 events
    if (data.securityEvents.length > 1000) {
      data.securityEvents = data.securityEvents.slice(0, 1000);
    }
    writeDb(data);
    return newEvent;
  },
  getSecurityEvents(limit = 100) {
    const data = readDb();
    return (data.securityEvents || []).slice(0, limit);
  },

  // Subscriptions
  getSubscription(userId) {
    const data = readDb();
    return (data.subscriptions || []).find(s => s.userId === userId && s.status === 'active');
  },
  saveSubscription(sub) {
    const data = readDb();
    data.subscriptions = data.subscriptions || [];
    const index = data.subscriptions.findIndex(s => s.userId === sub.userId);
    if (index !== -1) {
      data.subscriptions[index] = { ...data.subscriptions[index], ...sub };
    } else {
      data.subscriptions.push(sub);
    }
    writeDb(data);
    return sub;
  },

  // Certificates
  getCertificate(certificateId) {
    const data = readDb();
    return (data.certificates || []).find(c => c.certificateId === certificateId);
  },
  getCertificatesByUser(userId) {
    const data = readDb();
    return (data.certificates || []).filter(c => c.userId === userId);
  },
  saveCertificate(cert) {
    const data = readDb();
    data.certificates = data.certificates || [];
    data.certificates.push(cert);
    writeDb(data);
    return cert;
  }
};

ensureDb();

module.exports = db;
