export const setupPremiumHandler = (io, socket, redis) => {

  // 🔥 FIX 1: Verify premium by token - WITH EXPIRY CHECK
  socket.on('verify_premium', async ({ token, sessionId }) => {
    try {
      console.log("🔍 Verifying premium by token for session:", sessionId);

      const storedSession = await redis.get(`premium:${token}`);

      if (storedSession === sessionId) {
        // Get the TTL (time left) from Redis
        const ttl = await redis.ttl(`premium:${token}`);

        if (ttl > 0) {
          socket.premium = true;

          // Calculate expiry based on TTL (seconds to milliseconds)
          const expiresAt = Date.now() + (ttl * 1000);

          // Update session mapping
          await redis.setEx(`session:${sessionId}`, ttl, token);

          socket.emit('premium_verified', { expiresAt });
          console.log(`✨ Premium verified via token for session: ${sessionId}, TTL: ${ttl}s`);
        } else {
          // Token expired in Redis
          console.log(`⏰ Premium token expired for session: ${sessionId}`);
          await redis.del(`premium:${token}`);
          await redis.del(`session:${sessionId}`);
          socket.emit('premium_invalid');
        }
      } else {
        console.log(`❌ Invalid token for session: ${sessionId}`);
        socket.emit('premium_invalid');
      }
    } catch (error) {
      console.error('❌ Premium verification error:', error);
    }
  });

  // 🔥 FIX 2: Check premium by session (when token is missing)
  socket.on('check_premium_by_session', async ({ sessionId }) => {
    try {
      console.log("🔍 Checking premium by session:", sessionId);

      // Check if session has premium
      const token = await redis.get(`session:${sessionId}`);

      if (token) {
        const storedSession = await redis.get(`premium:${token}`);
        const ttl = await redis.ttl(`premium:${token}`);

        if (storedSession === sessionId && ttl > 0) {
          // Premium found! Restore it
          const expiresAt = Date.now() + (ttl * 1000);

          socket.emit('premium_verified', {
            expiresAt,
            restoredToken: token
          });

          console.log(`✨ Premium restored from session for: ${sessionId}, TTL: ${ttl}s`);
          return;
        }
      }

      console.log(`❌ No premium found for session: ${sessionId}`);
      socket.emit('premium_invalid');

    } catch (error) {
      console.error('❌ Session premium check error:', error);
    }
  });

  // Check premium status before gender filter
  const checkPremiumForGenderFilter = async (lookingFor) => {
    try {
      if (lookingFor === 'both') return true; // Free

      // Check if session has premium
      const token = await redis.get(`session:${socket.sessionId}`);
      if (token) {
        const session = await redis.get(`premium:${token}`);
        const ttl = await redis.ttl(`premium:${token}`);

        return session === socket.sessionId && ttl > 0;
      }

      return false;
    } catch (error) {
      console.error('❌ Premium check error:', error);
      return false;
    }
  };

  // Middleware for gender filter
  socket.use(async (packet, next) => {
    const [event, data] = packet;

    if (event === 'find_match' && data?.lookingFor && data.lookingFor !== 'both') {
      try {
        const hasPremium = await checkPremiumForGenderFilter(data.lookingFor);

        if (!hasPremium) {
          socket.emit('payment_required', {
            message: 'Pay ₹1 to unlock gender filter for 24 hours!',
            amount: 1
          });
          return;
        }
      } catch (error) {
        console.error('❌ Premium middleware error:', error);
        return;
      }
    }

    next();
  });
};