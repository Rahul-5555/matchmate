import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ✅ Debug: Check if keys are loaded
console.log('🔑 PaymentRoutes - RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Found' : '❌ Missing');
console.log('🔑 PaymentRoutes - RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Found' : '❌ Missing');

const router = express.Router();

// ✅ Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('✅ Razorpay initialized in paymentRoutes');

// Verify payment and issue token
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentId, sessionId } = req.body;
    const redis = req.app.get('redis');

    if (!redis) {
      return res.status(500).json({ error: 'Redis not available' });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status === 'captured') {
      const token = crypto.randomUUID();
      const ttl = 24 * 60 * 60; // 24 hours in seconds
      const expiresAt = Date.now() + (ttl * 1000);

      // 🔥 FIX: Store BOTH token and session with TTL
      await redis.setEx(`premium:${token}`, ttl, sessionId);
      await redis.setEx(`session:${sessionId}`, ttl, token);

      console.log(`✅ Premium activated for session: ${sessionId}, TTL: ${ttl}s`);

      res.json({
        success: true,
        token,
        expiresAt
      });
    } else {
      res.status(400).json({ error: 'Payment not captured' });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Simulate UPI payment
router.post('/simulate-payment', async (req, res) => {
  try {
    const { sessionId, amount } = req.body;
    const redis = req.app.get('redis');

    if (!redis) {
      return res.status(500).json({ error: 'Redis not available' });
    }

    console.log(`💰 Direct UPI payment received for session: ${sessionId}, amount: ₹${amount}`);

    const token = crypto.randomUUID();
    const ttl = 24 * 60 * 60; // 24 hours in seconds
    const expiresAt = Date.now() + (ttl * 1000);

    // 🔥 FIX: Store BOTH token and session with TTL
    await redis.setEx(`premium:${token}`, ttl, sessionId);
    await redis.setEx(`session:${sessionId}`, ttl, token);

    console.log(`✅ Premium activated via direct UPI for session: ${sessionId}, token: ${token}, TTL: ${ttl}s`);

    res.json({
      success: true,
      token,
      expiresAt
    });
  } catch (error) {
    console.error('❌ Simulated payment error:', error);
    res.status(500).json({ error: 'Payment activation failed' });
  }
});

// Verify token - UPDATED to use TTL
router.post('/verify-token', async (req, res) => {
  try {
    const { token, sessionId } = req.body;
    const redis = req.app.get('redis');

    if (!redis) {
      return res.status(500).json({ error: 'Redis not available' });
    }

    const storedSession = await redis.get(`premium:${token}`);

    if (storedSession === sessionId) {
      // Get TTL from Redis
      const ttl = await redis.ttl(`premium:${token}`);

      if (ttl > 0) {
        const expiresAt = Date.now() + (ttl * 1000);
        res.json({ valid: true, expiresAt, ttl });
      } else {
        // Token expired in Redis
        await redis.del(`premium:${token}`);
        await redis.del(`session:${sessionId}`);
        res.json({ valid: false, error: 'Token expired' });
      }
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

export default router;