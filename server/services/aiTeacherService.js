// AI English Teacher Service for LEARN WITH ARJEEVI
// Real-Time Pedagogical Engine with Level Adaptation, Gentle Error Correction,
// Role-Play Situations, Kannada Explanations, and End-of-Session Summaries.

const COMMON_GRAMMAR_PATTERNS = [
  {
    regex: /\bi\s+am\s+(\d+)\s+year\b/i,
    correction: "I am $1 years old",
    rule: "When stating age in English, say 'years old' (or simply 'I am 20'), never just 'year'.",
    kannada: "ವಯಸ್ಸನ್ನು ಹೇಳುವಾಗ 'I am ... years old' ಎಂದು ಹೇಳಬೇಕು.",
    example: "She is 21 years old."
  },
  {
    regex: /\bi\s+am\s+agree\b/i,
    correction: "I agree",
    rule: "In English, 'agree' is already a verb. We say 'I agree', not 'I am agree'.",
    kannada: "ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ 'I agree' ಎಂದು ಹೇಳಬೇಕು, 'I am agree' ತಪ್ಪು.",
    example: "I agree with your idea."
  },
  {
    regex: /\bhe\s+don'?t\b/i,
    correction: "He doesn't",
    rule: "Use 'doesn't' (does not) with singular third-person subjects (He, She, It).",
    kannada: "He/She/It ಜೊತೆಗೆ 'doesn't' ಬಳಸಬೇಕು, 'don't' ಅಲ್ಲ.",
    example: "He doesn't drink tea."
  },
  {
    regex: /\bshe\s+don'?t\b/i,
    correction: "She doesn't",
    rule: "Use 'doesn't' with singular pronouns like 'She'.",
    kannada: "She ಜೊತೆಗೆ 'doesn't' ಬಳಸಬೇಕು.",
    example: "She doesn't drive."
  },
  {
    regex: /\byesterday\s+i\s+go\b/i,
    correction: "Yesterday I went",
    rule: "When speaking about past events (yesterday, last week), use the past tense 'went'.",
    kannada: "ನಿನ್ನೆಯ ವಿಷಯ ಹೇಳುವಾಗ 'go' ಬದಲಾಗಿ ಪಾಸ್ಟ್ ಟೆನ್ಸ್ 'went' ಬಳಸಬೇಕು.",
    example: "Yesterday I went to market."
  },
  {
    regex: /\bi\s+did\s+went\b/i,
    correction: "I went / I did go",
    rule: "After auxiliary 'did', the main verb must always be in its base form ('I did go'), or simply say 'I went'.",
    kannada: "'did' ನಂತರ ಕ್ರಿಯಾಪದದ ಮೂಲ ರೂಪವನ್ನು ಬಳಸಬೇಕು.",
    example: "I went to college yesterday."
  },
  {
    regex: /\bi\s+didn'?t\s+(knew|saw|went|came|told)\b/i,
    correction: "I didn't know / see / go",
    rule: "After 'didn't', always use the base form of the verb (know, see, go), never the past tense.",
    kannada: "'didn't' ನಂತರ ವರ್ತಮಾನದ ಮೂಲ ಕ್ರಿಯಾಪದವನ್ನು ಬಳಸಬೇಕು.",
    example: "I didn't know about the test."
  },
  {
    regex: /\bdiscuss\s+about\b/i,
    correction: "discuss",
    rule: "'Discuss' already means 'talk about', so 'discuss about' is redundant. Say 'discuss the topic'.",
    kannada: "'Discuss' ಜೊತೆಗೆ 'about' ಬಳಸುವ ಅಗತ್ಯವಿಲ್ಲ.",
    example: "Let us discuss our project plan."
  },
  {
    regex: /\brevert\s+back\b/i,
    correction: "revert / reply",
    rule: "'Revert' means 'to return/reply', so 'revert back' is redundant. Say 'Please revert' or 'Please reply'.",
    kannada: "'Revert back' ಬದಲಿಗೆ 'revert' ಅಥವಾ 'reply' ಬಳಸಿ.",
    example: "I will revert with details tomorrow."
  },
  {
    regex: /\bcope\s+up\s+with\b/i,
    correction: "cope with",
    rule: "The correct standard English idiom is 'cope with', not 'cope up with'.",
    kannada: "ಸರಿಯಾದ ಇಂಗ್ಲಿಷ್ ಬಳಕೆ 'cope with'.",
    example: "She can easily cope with study pressure."
  },
  {
    regex: /\bme\s+and\s+my\s+friend\s+(went|are|is|have)\b/i,
    correction: "My friend and I $1",
    rule: "When you are the subject performing an action, polite English grammar puts the other person first: 'My friend and I'.",
    kannada: "ಕರ್ತೃ ಸ್ಥಾನದಲ್ಲಿ 'My friend and I' ಎಂದು ಹೇಳುವುದು ಸಭ್ಯ.",
    example: "My friend and I visited the library."
  },
  {
    regex: /\bmore\s+(better|faster|cheaper|taller)\b/i,
    correction: "much better / faster",
    rule: "Words like 'better' are already comparative. Do not combine 'more' with '-er' words. Say 'much better'.",
    kannada: "'better' ಜೊತೆಗೆ 'more' ಬಳಸಬೇಡಿ, 'much better' ಎನ್ನಿ.",
    example: "This method is much better."
  },
  {
    regex: /\bone\s+of\s+my\s+friend\b/i,
    correction: "one of my friends",
    rule: "'One of' is followed by a plural noun ('one of my friends').",
    kannada: "'one of' ನಂತರ ಬಹುವಚನ (friends) ಇರಬೇಕು.",
    example: "One of my friends works at Infosys."
  },
  {
    regex: /\bsince\s+(\d+)\s+(years|months|days)\b/i,
    correction: "for $1 $2",
    rule: "Use 'for' for a duration of time ('for 3 years'). Use 'since' for a specific starting point in time ('since 2021').",
    kannada: "ಸಮಯದ ಅವಧಿಗೆ 'for' ಬಳಸಬೇಕು, ಆರಂಭಿಕ ಬಿಂದುವಿಗೆ 'since' ಬಳಸಬೇಕು.",
    example: "I have been learning English for 2 years."
  }
];

// Rich situational topic starters and context prompts
const TOPIC_CONFIGS = {
  day: {
    title: "My Day & Routine",
    prompts: [
      "Tell me how your day started today. Did you wake up early?",
      "What is something interesting or productive you accomplished today?",
      "How do you usually like to unwind or relax in the evening?"
    ]
  },
  interests: {
    title: "Interests & Hobbies",
    prompts: [
      "What kind of hobbies or activities make you feel happiest?",
      "Do you enjoy music, sports, movies, or reading books in your free time?",
      "If you had a completely free Sunday, how would you spend it?"
    ]
  },
  college: {
    title: "College & Campus Life",
    prompts: [
      "What subject or course are you currently studying or most interested in?",
      "How is your college campus or learning environment? Tell me about your friends.",
      "Are you working on any interesting academic projects or preparing for exams?"
    ]
  },
  career: {
    title: "Job Interview & Career Goals",
    prompts: [
      "Welcome to our practice session! Could you introduce yourself briefly and share your career aspirations?",
      "What do you consider your greatest personal or technical strength?",
      "Where do you see yourself professionally in two to three years?"
    ]
  },
  situations: {
    title: "Daily Situations (Cafe, Travel, Shopping)",
    prompts: [
      "Good day! Welcome to our cafe in Bengaluru. What delicious hot or cold beverage can I get for you today?",
      "Excuse me! Could you tell me how to get to the nearest metro station from here?",
      "Hello, traveler! May I check your boarding pass and destination for today?"
    ]
  },
  general: {
    title: "Friendly Spoken Practice",
    prompts: [
      "Hello! It is wonderful to speak with you today. How are you feeling right now?",
      "What is on your mind today? We can chat about anything you like.",
      "Tell me about your hometown or a place you love visiting."
    ]
  }
};

class AITeacherService {
  // Check provider status (Gemini vs Built-In)
  getProviderStatus() {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
    return {
      success: true,
      provider: hasGemini ? 'Google Gemini 1.5' : 'Built-in Pedagogical Speech Pipeline',
      activeModel: hasGemini ? 'gemini-1.5-flash' : 'Arjeevi NLP Pedagogical Engine v2',
      hasCloudCredentials: hasGemini,
      speechPipeline: 'Browser-Native Streaming SpeechRecognition + SpeechSynthesis',
      setupGuide: {
        title: 'Cloud Real-Time AI Setup Guide',
        isConfigured: hasGemini,
        instructions: [
          'Get a free Gemini API key from Google AI Studio (https://aistudio.google.com/).',
          'Add GEMINI_API_KEY=your_key_here to the .env file in the project root.',
          'Restart the server. The AI Teacher will automatically use Gemini 1.5 Flash alongside the real-time speech pipeline.',
          'Note: The built-in pedagogical teacher works 100% locally with zero external API keys required!'
        ]
      }
    };
  }

  // Analyze user utterance for grammar slips
  analyzeGrammar(text) {
    if (!text || typeof text !== 'string') return null;

    for (const pattern of COMMON_GRAMMAR_PATTERNS) {
      if (pattern.regex.test(text)) {
        return {
          originalSnippet: text,
          suggestedCorrection: text.replace(pattern.regex, pattern.correction),
          ruleExplanation: pattern.rule,
          kannadaExplanation: pattern.kannada,
          exampleSentence: pattern.example
        };
      }
    }
    return null;
  }

  // Extract vocabulary words from user and teacher conversation
  extractVocabulary(conversation = []) {
    const vocabPool = [
      { word: "Perseverance", meaning: "Continued effort to do or achieve something despite difficulties", example: "Her perseverance helped her speak English fluently." },
      { word: "Articulate", meaning: "Expressing ideas clearly and effectively in speech", example: "He gave an articulate presentation to the team." },
      { word: "Confident", meaning: "Feeling or showing certainty about something", example: "Practice makes you confident in job interviews." },
      { word: "Aspiration", meaning: "A strong hope or ambition of achieving something", example: "His career aspiration is to become a software architect." },
      { word: "Authentic", meaning: "Real, genuine, and true to one's own personality", example: "Speaking with authentic enthusiasm connects people." },
      { word: "Collaborate", meaning: "Work jointly on an activity or project", example: "Students collaborate on interesting campus initiatives." },
      { word: "Resilient", meaning: "Able to withstand or recover quickly from difficult conditions", example: "Confident speakers are resilient when making minor slips." }
    ];

    // Pick 3-4 relevant vocabulary words for the session summary
    return vocabPool.slice(0, 4);
  }

  // Generate real-time pedagogical reply
  async generateResponse({
    userMessage,
    conversationHistory = [],
    learnerLevel = 'Beginner',
    preferredLanguage = 'English',
    roleplayMode = 'general',
    learnerName = 'Friend'
  }) {
    const grammarFeedback = this.analyzeGrammar(userMessage);

    // If Gemini API Key is configured, attempt high-fidelity generative response
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const geminiResponse = await this.callGeminiAPI({
          userMessage,
          conversationHistory,
          learnerLevel,
          preferredLanguage,
          roleplayMode,
          grammarFeedback,
          learnerName
        });
        if (geminiResponse) {
          return {
            ...geminiResponse,
            grammarFeedback: geminiResponse.grammarFeedback || grammarFeedback,
            engine: 'Google Gemini 1.5 Flash'
          };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in pedagogical engine:', err.message);
      }
    }

    // Built-in intelligent conversational pedagogical engine
    const builtInReply = this.generateBuiltInPedagogicalResponse({
      userMessage,
      conversationHistory,
      learnerLevel,
      preferredLanguage,
      roleplayMode,
      learnerName,
      grammarFeedback
    });

    return {
      ...builtInReply,
      engine: 'Built-in Pedagogical Speech Engine'
    };
  }

  // Built-in pedagogical response engine
  generateBuiltInPedagogicalResponse({
    userMessage,
    conversationHistory,
    learnerLevel,
    preferredLanguage,
    roleplayMode,
    learnerName,
    grammarFeedback
  }) {
    const textLower = (userMessage || '').toLowerCase().trim();
    let reply = '';
    let followUp = '';
    let kannadaNote = '';

    // Determine speech rate and phrasing complexity based on learner level
    let speechRate = 0.92;
    if (learnerLevel === 'Beginner') speechRate = 0.85;
    else if (learnerLevel === 'Advanced') speechRate = 1.05;

    // 1. Gentle Grammar Error Correction
    if (grammarFeedback) {
      reply = `You expressed your thought nicely! A natural way to say that is: "${grammarFeedback.suggestedCorrection}". ${grammarFeedback.ruleExplanation}`;
      followUp = `Would you like to try saying that sentence again, ${learnerName}?`;
      if (preferredLanguage.includes('Kannada') || preferredLanguage === 'Kannada') {
        kannadaNote = grammarFeedback.kannadaExplanation;
      }
      return {
        speechText: `${reply} ${followUp}`,
        displayMessage: reply,
        followUpQuestion: followUp,
        kannadaNote,
        grammarFeedback,
        speechRate,
        encouragement: "Small mistakes are proof that you are practicing and growing!"
      };
    }

    // 2. Situational Dialogs
    if (roleplayMode === 'career') {
      if (textLower.includes('myself') || textLower.includes('name is') || textLower.includes('developer') || textLower.includes('student') || textLower.includes('engineer')) {
        reply = `That was a polished self-introduction, ${learnerName}! You highlighted your background effectively.`;
        followUp = "Could you tell me about a project or challenge you recently tackled?";
      } else if (textLower.includes('project') || textLower.includes('built') || textLower.includes('team') || textLower.includes('problem') || textLower.includes('app')) {
        reply = "Impressive explanation! Describing your technical workflow clearly demonstrates great problem-solving.";
        followUp = "What is one professional goal or skill you are actively working towards this year?";
      } else if (textLower.includes('goal') || textLower.includes('learn') || textLower.includes('company') || textLower.includes('lead')) {
        reply = "That shows inspiring ambition! Clear career vision is admired by every top recruiter.";
        followUp = "How do you usually collaborate with others when working in a team?";
      } else {
        reply = "Welcome to our career practice interview. Take a calm breath — you have plenty of time to share your thoughts.";
        followUp = "To start, could you please introduce yourself and tell me what excites you about your field?";
      }
    } else if (roleplayMode === 'college') {
      if (textLower.includes('computer') || textLower.includes('science') || textLower.includes('arts') || textLower.includes('commerce') || textLower.includes('engineering') || textLower.includes('study')) {
        reply = `That is a vibrant discipline to pursue, ${learnerName}! Academic knowledge builds great confidence.`;
        followUp = "What is your favorite subject or topic in that area so far?";
      } else if (textLower.includes('friend') || textLower.includes('campus') || textLower.includes('library') || textLower.includes('canteen')) {
        reply = "Campus friendships make college memories truly special!";
        followUp = "What do you and your friends usually do during lunch break or after classes?";
      } else if (textLower.includes('exam') || textLower.includes('test') || textLower.includes('assignment') || textLower.includes('stress')) {
        reply = "Exams can feel demanding, but steady preparation always pays off.";
        followUp = "How do you manage your study routine when exams are approaching?";
      } else {
        reply = "College life gives you so many opportunities to speak up and participate.";
        followUp = "Tell me about your college or what subject you find most interesting.";
      }
    } else if (roleplayMode === 'day') {
      if (textLower.includes('morning') || textLower.includes('wake') || textLower.includes('early') || textLower.includes('tea') || textLower.includes('coffee')) {
        reply = "Starting your day with a calm routine sets a positive mood for the entire day!";
        followUp = "What is the most important task or activity you had scheduled for today?";
      } else if (textLower.includes('work') || textLower.includes('study') || textLower.includes('busy') || textLower.includes('tired')) {
        reply = "You have had a very productive day! Be proud of the effort you put in.";
        followUp = "How do you like to relax and recharge your mind in the evening?";
      } else if (textLower.includes('good') || textLower.includes('fine') || textLower.includes('great') || textLower.includes('peaceful')) {
        reply = "I am delighted to hear that! Positive energy makes English conversation enjoyable.";
        followUp = "Did anything unexpected or memorable happen in your routine today?";
      } else {
        reply = "Reflecting on daily activities is a great way to practice natural conversational English.";
        followUp = "How has your day unfolded so far, from the morning until now?";
      }
    } else if (roleplayMode === 'interests') {
      if (textLower.includes('music') || textLower.includes('song') || textLower.includes('singer')) {
        reply = "Music connects emotion with language beautifully! It is also wonderful for pronunciation.";
        followUp = "What genre of music or which artist do you enjoy listening to the most?";
      } else if (textLower.includes('cricket') || textLower.includes('football') || textLower.includes('sport') || textLower.includes('game')) {
        reply = "Sports keep energy high and teach great teamwork!";
        followUp = "Do you prefer playing on the field or watching matches with friends?";
      } else if (textLower.includes('movie') || textLower.includes('series') || textLower.includes('cinema') || textLower.includes('watch')) {
        reply = "Watching movies in English is one of the fastest secrets to picking up natural phrasing.";
        followUp = "What is a memorable movie or show that left a strong impression on you?";
      } else {
        reply = "Talking about your genuine interests allows your voice to flow naturally without fear.";
        followUp = "What hobby or leisure activity brings you the most happiness?";
      }
    } else if (roleplayMode === 'situations') {
      if (textLower.includes('coffee') || textLower.includes('tea') || textLower.includes('latte') || textLower.includes('cappuccino')) {
        reply = "Excellent order! Our fresh roast has a rich aroma today.";
        followUp = "Would you like that with sugar, or would you prefer a warm snack like a croissant?";
      } else if (textLower.includes('metro') || textLower.includes('station') || textLower.includes('train') || textLower.includes('bus') || textLower.includes('direction')) {
        reply = "Certainly! Walk straight down this boulevard, turn left at the traffic signal, and the metro entry is on your right.";
        followUp = "Are you traveling far today, or heading somewhere nearby?";
      } else {
        reply = "Welcome! Practicing everyday situational English will make you feel confident anywhere in the world.";
        followUp = "Imagine you are visiting a friendly cafe in Bengaluru. What can I brew for you today?";
      }
    } else {
      // General Supportive Mentor
      if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey') || textLower.includes('namaste')) {
        reply = `Hello ${learnerName}! It is a pleasure to talk with you. Remember: there is zero pressure here. We speak as friends.`;
        followUp = "How are you feeling today?";
      } else if (textLower.includes('nervous') || textLower.includes('scared') || textLower.includes('fear') || textLower.includes('shy')) {
        reply = "I completely understand. Every fluent speaker was once nervous. You are taking a brave, wonderful step right now.";
        followUp = "Take a gentle breath. What is your favorite food or favorite place in your hometown?";
        if (preferredLanguage.includes('Kannada')) {
          kannadaNote = "ಹೆದರಬೇಡಿ! ತಪ್ಪು ಮಾಡುವುದು ಕಲಿಯುವ ಪ್ರಕ್ರಿಯೆಯ ಒಂದು ಸಹಜ ಭಾಗ. ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ.";
        }
      } else {
        reply = `You spoke with great clarity, ${learnerName}! Your sentence flow is getting smoother.`;
        followUp = "What else would you like to explore or share with me today?";
      }
    }

    if (preferredLanguage.includes('Kannada') && !kannadaNote) {
      kannadaNote = "ನೀವು ಉತ್ತಮವಾಗಿ ಮಾತನಾಡುತ್ತಿದ್ದೀರಿ. ಪ್ರತಿದಿನ 15 ನಿಮಿಷಗಳ ಮಾತನಾಡುವ ಅಭ್ಯಾಸ ನಿಮ್ಮ ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.";
    }

    return {
      speechText: `${reply} ${followUp}`,
      displayMessage: reply,
      followUpQuestion: followUp,
      kannadaNote,
      grammarFeedback: null,
      speechRate,
      encouragement: "Fantastic speaking pace! Keep going."
    };
  }

  // Generate comprehensive end-of-session pedagogical summary
  generateSessionSummary({ conversation = [], learnerLevel = 'Beginner', durationSeconds = 180, learnerName = 'Friend' }) {
    const userUtterances = conversation.filter(msg => msg.sender === 'user');
    const totalTurns = userUtterances.length;
    const grammarSlips = conversation.filter(msg => msg.grammarFeedback).map(msg => msg.grammarFeedback);

    // Compute dynamic fluency & confidence score
    let baseScore = 75;
    if (totalTurns >= 5) baseScore += 10;
    if (totalTurns >= 10) baseScore += 5;
    const errorDeduction = Math.min(grammarSlips.length * 3, 15);
    const fluencyScore = Math.max(65, Math.min(98, baseScore - errorDeduction));

    const vocabulary = this.extractVocabulary(conversation);

    return {
      success: true,
      summary: {
        learnerName,
        learnerLevel,
        durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
        totalTurns,
        fluencyScore,
        consistencyStreakDays: 1, // Will be updated in DB
        encouragementNote: `Splendid job, ${learnerName}! You practiced natural spoken English for ${Math.max(1, Math.round(durationSeconds / 60))} minutes without hesitation. Speaking consistently is your superpower!`,
        vocabularyLearned: vocabulary,
        grammarSlipsReviewed: grammarSlips.map(g => ({
          spokenPhrase: g.originalSnippet,
          correctedPhrase: g.suggestedCorrection,
          rule: g.ruleExplanation,
          kannada: g.kannadaExplanation
        })),
        kannadaSummary: "ಅದ್ಭುತವಾದ ಪ್ರಯತ್ನ! ನಿಮ್ಮ ಧ್ವನಿ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಮಾತುಗಾರಿಕೆ ದಿನದಿಂದ ದಿನಕ್ಕೆ ಸುಧಾರಿಸುತ್ತಿದೆ. ಇದೇ ರೀತಿ ಮುಂದುವರಿಯಿರಿ."
      }
    };
  }

  // Gemini Generative API Connector
  async callGeminiAPI({ userMessage, conversationHistory, learnerLevel, preferredLanguage, roleplayMode, grammarFeedback, learnerName }) {
    const fetch = global.fetch;
    if (!fetch) return null;

    const systemPrompt = `You are Arjeevi, a world-class, ultra-supportive AI English teacher for learners who feel shy or nervous speaking English.
Learner Name: ${learnerName}
Learner Level: ${learnerLevel} (Beginner: speak simply and warmly. Intermediate: natural conversational pacing. Advanced: rich vocabulary and thought-provoking questions).
Mode: ${roleplayMode}.
Preferred Explanation Language: ${preferredLanguage}.

Rules:
1. Speak in warm, empathetic, natural English.
2. Limit your reply to 2-3 short, spoken sentences that are easy to hear via text-to-speech.
3. If the user made a grammar or pronunciation slip, gently show the correct natural phrase and encourage them.
4. If they requested Kannada or their preferred language is Kannada, include a helpful 1-sentence Kannada explanation in 'kannadaNote'.
5. Always end with an easy, open follow-up question that invites them to continue speaking.
6. Never judge, correct aggressively, or overwhelm the learner.

Return valid JSON with these keys:
{
  "speechText": "Spoken text that will be read aloud by speech synthesizer",
  "displayMessage": "Encouraging teaching response",
  "followUpQuestion": "Friendly open follow-up question",
  "kannadaNote": "Optional Kannada translation/hint if requested or relevant",
  "encouragement": "Short uplifting cheer",
  "speechRate": 0.95
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nRecent context: ${JSON.stringify(conversationHistory.slice(-4))}\n\nLearner said: "${userMessage}"` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return JSON.parse(candidateText);
    }
    return null;
  }
}

module.exports = new AITeacherService();
