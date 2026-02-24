// Gender options for filter
export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  BOTH: 'both'
};

// Display names for UI
export const GENDER_LABELS = {
  [GENDERS.MALE]: '♂️ Male',
  [GENDERS.FEMALE]: '♀️ Female',
  [GENDERS.BOTH]: '⚧ Both (No filter)'
};

// Price for gender filter (₹1/day)
export const GENDER_FILTER_PRICE = 1;

// Default user preference
export const DEFAULT_GENDER_PREFERENCE = {
  myGender: GENDERS.MALE,
  lookingFor: GENDERS.BOTH
};

// Store keys for Redis
export const REDIS_KEYS = {
  // Queue keys
  genderQueue: (gender, interest) => `queue:${gender}:${interest || 'global'}`,

  // Payment keys (24hr TTL)
  paidUser: (sessionId) => `paid:${sessionId}`,

  // User preference keys
  userPreference: (sessionId) => `pref:${sessionId}`,

  // Stats keys
  genderStats: 'stats:gender'
};

// Error messages
export const ERROR_MESSAGES = {
  PAYMENT_REQUIRED: 'Pay ₹1 to filter by gender. Unlimited chats for 24 hours!',
  INVALID_GENDER: 'Please select your gender',
  NO_MATCH: 'No one available right now. Please try again.',
  SERVER_ERROR: 'Something went wrong. Please try again.'
};