// Gender options for filter
export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  BOTH: 'both'
};

// Language options - NEW
export const LANGUAGES = [
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', englishName: 'Hindi' },
  { code: 'en', name: 'English', flag: '🇬🇧', englishName: 'English' },
  { code: 'hi-en', name: 'Hinglish', flag: '🇮🇳', englishName: 'Hinglish' }
];

// Display names for UI
export const GENDER_LABELS = {
  [GENDERS.MALE]: '♂️ Male',
  [GENDERS.FEMALE]: '♀️ Female',
  [GENDERS.BOTH]: '⚧ Both (No filter)'
};

// Price for gender filter (₹1/day)
export const GENDER_FILTER_PRICE = 1;

// Default user preference
export const DEFAULT_USER_PREFERENCE = {
  myGender: GENDERS.MALE,
  lookingFor: GENDERS.BOTH,
  language: 'hi-en' // Default Hinglish
};

// Store keys for Redis - UPDATED with premium keys
export const REDIS_KEYS = {
  // Queue keys
  genderQueue: (gender, interest) => `queue:${gender}:${interest || 'global'}`,

  // Payment keys (24hr TTL) - UPDATED
  premiumToken: (token) => `premium:${token}`,
  sessionMapping: (sessionId) => `session:${sessionId}`,
  paymentOrder: (orderId) => `payment:${orderId}`,

  // User preference keys
  userPreference: (sessionId) => `pref:${sessionId}`,

  // Stats keys
  genderStats: 'stats:gender'
};

// Multilingual Messages - NEW
export const MESSAGES = {
  hi: {
    paymentRequired: "₹1 देकर 24 घंटे के लिए जेंडर फ़िल्टर अनलॉक करें!",
    paymentSuccess: "पेमेंट सफल! 24 घंटे के लिए प्रीमियम एक्टिवेटेड",
    selectLanguage: "भाषा चुनें",
    selectGender: "अपना जेंडर चुनें",
    lookingFor: "किससे बात करना चाहते हैं?",
    free: "मुफ्त",
    premium: "प्रीमियम",
    active: "सक्रिय",
    continue: "जारी रखें",
    cancel: "रद्द करें",
    skip: "अभी नहीं"
  },
  en: {
    paymentRequired: "Pay ₹1 to unlock gender filter for 24 hours!",
    paymentSuccess: "Payment successful! Premium activated for 24h",
    selectLanguage: "Select Language",
    selectGender: "Select your gender",
    lookingFor: "Who do you want to talk to?",
    free: "Free",
    premium: "Premium",
    active: "Active",
    continue: "Continue",
    cancel: "Cancel",
    skip: "Skip for now"
  },
  'hi-en': {
    paymentRequired: "₹1 dekar 24 hours ke liye gender filter unlock karo!",
    paymentSuccess: "Payment successful! 24 hours ke liye premium active",
    selectLanguage: "Apni bhasha chunen",
    selectGender: "Apna gender chunen",
    lookingFor: "Kis se baat karni hai?",
    free: "Free",
    premium: "Premium",
    active: "Active",
    continue: "Continue",
    cancel: "Cancel",
    skip: "Skip for now"
  }
};

// Error messages - UPDATED with multilingual support
export const ERROR_MESSAGES = {
  PAYMENT_REQUIRED: 'Pay ₹1 to filter by gender. Unlimited chats for 24 hours!',
  INVALID_GENDER: 'Please select your gender',
  NO_MATCH: 'No one available right now. Please try again.',
  SERVER_ERROR: 'Something went wrong. Please try again.'
};

// Success messages - UPDATED with multilingual support
export const SUCCESS_MESSAGES = {
  PAYMENT_SUCCESS: 'Payment successful! You can now filter by gender.',
  MATCH_FOUND: 'Match found! Connecting you now...',
  QUEUE_ADDED: 'Added to queue. You\'ll be matched soon!'
};

// Also export as default if needed
export default {
  GENDERS,
  GENDER_LABELS,
  GENDER_FILTER_PRICE,
  DEFAULT_USER_PREFERENCE,
  LANGUAGES,
  MESSAGES,
  REDIS_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};