import {
  addToGenderQueue,
  findMatchInGenderQueue,
  removeFromAllGenderQueues,
  storeUserPreference
} from '../redis/genderQueues.js';
import { createMatch } from './matchingHandler.js'; // Existing match function

export const setupGenderHandler = (io, socket, redis) => {

  // Handle find match with gender filter
  socket.on('find_match_with_gender', async ({ myGender, lookingFor, interest = 'global' }) => {
    try {
      const sessionId = socket.sessionId;

      console.log(`🔍 Gender match: ${socket.id} (${myGender} looking for ${lookingFor})`);

      // Store user preference
      await storeUserPreference(redis, sessionId, { myGender, lookingFor });

      // Agar "both" hai to existing matching use karo (free)
      if (lookingFor === 'both') {
        console.log(`🆓 Free match (both genders) for ${socket.id}`);

        // Use existing matching logic
        socket.emit('use_standard_matching', { interest });
        return;
      }

      // Check if user has paid for gender filter
      const hasPaid = await redis.get(`paid:${sessionId}`);

      if (!hasPaid) {
        console.log(`💰 Payment required for ${socket.id}`);
        socket.emit('payment_required', {
          message: 'Pay ₹1 to filter by gender. Unlimited chats for 24 hours!',
          amount: 1
        });
        return;
      }

      // Try to find match in target gender queue
      let partnerId = await findMatchInGenderQueue(redis, myGender, lookingFor, interest);

      if (partnerId) {
        // Match found!
        console.log(`✅ Match found: ${socket.id} <-> ${partnerId}`);

        // Remove from any existing queues
        await removeFromAllGenderQueues(redis, socket.id);
        await removeFromAllGenderQueues(redis, partnerId);

        // Create the match (reuse existing function)
        await createMatch(io, redis, socket.id, partnerId, interest);

      } else {
        // No match found, add to queue
        console.log(`⏳ No match, adding ${socket.id} to ${myGender} queue`);
        await addToGenderQueue(redis, socket.id, myGender, interest);

        socket.emit('waiting_match', {
          message: 'No one available right now. You\'re in queue.'
        });
      }

    } catch (error) {
      console.error('❌ Gender match error:', error);
      socket.emit('error', { message: 'Failed to find match' });
    }
  });

  // Handle payment verification
  socket.on('verify_payment', async ({ paymentId, amount }) => {
    try {
      const sessionId = socket.sessionId;

      // Verify payment with Razorpay (simplified)
      // In production, verify with Razorpay API

      if (paymentId && amount === 1) {
        // Mark user as paid for 24 hours
        await redis.setex(`paid:${sessionId}`, 24 * 60 * 60, 'true');

        console.log(`✅ Payment verified for ${sessionId}`);
        socket.emit('payment_verified', {
          message: 'Payment successful! You can now filter by gender.'
        });

        // Immediately try to match with their last preference
        const pref = await redis.hGetAll(`pref:${sessionId}`);
        if (pref && pref.myGender && pref.lookingFor) {
          socket.emit('retry_match', {
            myGender: pref.myGender,
            lookingFor: pref.lookingFor
          });
        }
      } else {
        socket.emit('payment_failed', {
          message: 'Payment verification failed. Please try again.'
        });
      }

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      socket.emit('error', { message: 'Payment verification failed' });
    }
  });

  // Cancel waiting
  socket.on('cancel_waiting', async () => {
    await removeFromAllGenderQueues(redis, socket.id);
    socket.emit('waiting_cancelled');
  });
};