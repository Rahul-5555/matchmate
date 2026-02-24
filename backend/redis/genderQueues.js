// Gender-based queue keys
export const queueKey = (gender, interest = 'global') => `queue:${gender}:${interest}`;

// Add user to gender queue
export const addToGenderQueue = async (redis, socketId, gender, interest) => {
  const key = queueKey(gender, interest);
  await redis.lPush(key, socketId);
  console.log(`📥 Added to ${gender} queue (${interest}): ${socketId}`);

  // Get queue length for stats
  const length = await redis.lLen(key);
  return length;
};

// Remove user from all gender queues
export const removeFromAllGenderQueues = async (redis, socketId) => {
  const keys = await redis.keys('queue:*:*');
  let removed = 0;

  for (const key of keys) {
    const result = await redis.lRem(key, 0, socketId);
    if (result > 0) removed += result;
  }

  if (removed > 0) {
    console.log(`🗑️ Removed ${socketId} from ${removed} gender queues`);
  }
  return removed;
};

// Find match in gender queue
export const findMatchInGenderQueue = async (redis, myGender, lookingFor, interest) => {
  const targetKey = queueKey(lookingFor, interest);

  // Try to get a user from target queue
  const partnerId = await redis.rPop(targetKey);

  if (partnerId) {
    console.log(`✅ Found match in ${lookingFor} queue: ${partnerId}`);
    return partnerId;
  }

  return null;
};

// Get queue stats
export const getGenderQueueStats = async (redis) => {
  const keys = await redis.keys('queue:*:*');
  const stats = {};

  for (const key of keys) {
    const [_, gender, interest] = key.split(':');
    const length = await redis.lLen(key);

    if (!stats[gender]) stats[gender] = {};
    stats[gender][interest] = length;
  }

  return stats;
};

// Store user gender preference
export const storeUserPreference = async (redis, sessionId, preference) => {
  const key = `pref:${sessionId}`;
  await redis.hSet(key, {
    myGender: preference.myGender,
    lookingFor: preference.lookingFor,
    updatedAt: Date.now()
  });
  await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
};

// Get user gender preference
export const getUserPreference = async (redis, sessionId) => {
  const key = `pref:${sessionId}`;
  const pref = await redis.hGetAll(key);

  if (pref && pref.myGender) {
    return {
      myGender: pref.myGender,
      lookingFor: pref.lookingFor
    };
  }

  return null;
};