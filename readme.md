♟ MatchMate — Anonymous Chat & Audio Platform

MatchMate is a *real-time anonymous chat and audio calling platform* inspired by apps like Omegle, built with **React, Socket.IO, and WebRTC**.

No login.
No profile.
Just instant conversations with random people.

🔗 **Live Demo:**
👉 [https://matchmate-8yop.onrender.com](https://matchmate-8yop.onrender.com)

---

## 🚀 Features

### 💬 Real-Time Chat

* One-to-one anonymous messaging
* Instant message delivery using Socket.IO
* Typing indicator (live)

### 🎧 Audio Calling

* Peer-to-peer audio calls using WebRTC
* Mute / unmute support
* Auto end after fixed duration

### 🔀 Random Matching

* Automatically matches users with strangers
* Skip / end conversation anytime
* Clean exit handling (no ghost users)

### 👥 Live Online Users

* Real-time online users count
* Updates on connect / disconnect

### 🌗 Dark & Light Mode

* System-aware theme (first visit)
* Manual toggle
* Theme saved in localStorage

### ⚡ Performance & UX

* Smooth UI transitions
* Auto-scroll chat
* Responsive design (mobile friendly)

---

## 🛠 Tech Stack

### Frontend

* **React (Vite)**
* **Tailwind CSS**
* **Socket.IO Client**
* **WebRTC**

### Backend

* **Node.js**
* **Express**
* **Socket.IO**
* **In-memory matchmaking logic**

### Deployment

* **Frontend:** Netlify
* **Backend:** Render

---

## 📂 Project Structure

```
src/
├── components/
│   ├── AudioCall.jsx
│   ├── StatBar.jsx
│   ├── ThemeToggle.jsx
│   └── Header.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── Matching.jsx
│   ├── Chat.jsx
│
├── assets/
│   └── heroS.png
│
├── index.css
├── main.jsx
└── App.jsx
```

---

## ⚙️ Environment Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/matchmate.git
cd matchmate
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file (this file is ignored by Git):

```env
VITE_SOCKET_URL=http://localhost:5000
```

> 📌 `.env` is included in `.gitignore` for security.

### 4️⃣ Start development server

```bash
npm run dev
```

---

## 🔌 Socket Events Used

| Event                    | Purpose              |
| ------------------------ | -------------------- |
| `find_match`             | Start matchmaking    |
| `match_found`            | Match success        |
| `send_message`           | Send chat message    |
| `receive_message`        | Receive message      |
| `typing` / `stop_typing` | Typing indicator     |
| `partner_left`           | Partner disconnected |
| `match_timeout`          | Auto end chat        |
| `online_count`           | Live user count      |

---

## 🧠 Learning Highlights

This project demonstrates:

* Real-time communication with Socket.IO
* WebRTC audio call setup
* Matchmaking queue logic
* Clean React component separation
* State & lifecycle management
* Production deployment workflow

---

## 🧪 Safety & Privacy

* No user authentication
* No chat history stored
* No personal data collected
* Fully anonymous interactions

---

## 📌 Future Improvements

* Video calling
* Chat moderation / report
* Geo-based matching
* Reconnection handling
* Message encryption

---

## 👨‍💻 Author

**Rahul Kumar**
MERN Stack Developer

> “I built MatchMate to understand real-time systems, WebRTC, and scalable frontend architecture.”

---



---


components/
 ├─ AudioCall.jsx
 ├─ Header.jsx
 ├─ StatBar.jsx

pages/
 ├─ Home.jsx
 ├─ Matching.jsx
 ├─ MatchFound.jsx
 ├─ Chat.jsx
 ├─ ChatAudioController.jsx

hooks/
 ├─ useWebRTC.js
 ├─ useWebVoiceActivity.jsx






Rahul 🔥
6 months de sakte ho?

Then listen carefully…

**Yeh project tumhari life change kar sakta hai — but only if we build it like a startup, not like a college project.**

---

# 🚀 6 Month Roadmap – MatchMate (India Focused)

## 🟢 Month 1 – Solid Foundation

Goal: Stable anonymous voice + chat

* Queue based matching (no bugs)
* WebRTC voice working smoothly
* 10 minute server-side timer
* Clean UI (simple, fast)
* Skip button
* Disconnect button

No earning. No distraction.

---

## 🟢 Month 2 – Control System (Very Important)

Anonymous apps fail because of abuse.

Add:

* Report button
* Block system
* Temporary user ID
* Device/session tracking
* Ban logic (IP or device based)

This is what killed:

* Omegle

We don’t repeat their mistake.

---

## 🟢 Month 3 – Improve Retention

Add:

* 3 free calls per day
* Call rating (⭐ 1–5)
* Reconnect option (if both agree)
* “How are you feeling today?” onboarding

Now users start coming back.

---

## 🟢 Month 4 – Add Monetization (Soft Launch)

Integrate:

* Razorpay

Plan:

* Free: 3 calls/day
* ₹1 = unlimited for 24 hours
* ₹29 weekly
* ₹99 monthly

Now revenue starts.

---

## 🟢 Month 5 – Optimization + Scaling

* Reduce server cost
* Optimize WebRTC
* Improve matching speed
* Add waiting animation
* Add “Users Online” counter

---

## 🟢 Month 6 – Marketing + Growth

Indian targeting:

* College students
* Instagram reels
* Meme marketing
* Emotional ads

Positioning:

> “Bore ho? Kisi anjaan se baat karo.
> No judgement. No identity.”

---

# 💰 Realistic Income Expectation

Let’s be practical.

If after 6 months:

* 5,000 daily users
* 10% convert to ₹1 plan

500 paying users/day = ₹500/day
₹15,000/month

If it scales to 20k daily users →
₹60,000–₹1L per month possible.

But only if product strong ho.

---

# ⚠️ Biggest Danger

Anonymous voice apps become:

* Dirty talk platforms
* Harassment space
* Recording misuse

If that happens →
App ban + no advertisers + no payment gateway support.

So moderation system mandatory.

---

# 🧠 My Honest Opinion

Rahul, this is:

* Better than typical MERN portfolio
* Real startup idea
* Emotion-based product
* High engagement potential

But success = discipline + weekly improvement.

---

Now next step:

Send me:

* Current backend structure
* Matching logic
* Socket connection code

We start Month 1 work today.

Aur yaad rakho —

**Paise kamane ke liye pehle product strong banana padta hai.** 💪





🚀 What We Should Improve First (Priority Order)
🥇 1. Move State to Redis

This is mandatory before launch.

🥈 2. Prevent Repeat Matching

Store last 5 partners per session.

🥉 3. Improve Daily Limit System

Move to Redis with TTL.

4. Add Abuse Detection

Basic bad word filter server-side.

5. Add Soft User Token

Generate secure random sessionId server-side.

1️⃣ Keep it fully anonymous forever?
2️⃣ Add optional lightweight profile layer?



## 🔥 **CRITICAL ERROR: Redis Connection Failed!**

**Problem:** Server `127.0.0.1:6379` par Redis connect nahi ho raha. Ye **production environment** mein common hai kyunki Redis alag URL par hota hai.

## ✅ **Fix - Redis Connection for Production**

```javascript
/* =======================
   REDIS SETUP - FIXED FOR PRODUCTION
======================= */

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`🔄 Redis reconnection attempt ${retries}`);
      
      // Agar REDIS_URL set hai to zyada attempts do
      const maxRetries = process.env.REDIS_URL ? 20 : 10;
      
      if (retries > maxRetries) {
        console.error(`❌ Too many Redis reconnection attempts (${maxRetries})`);
        return new Error("Redis connection failed");
      }
      
      // Exponential backoff
      return Math.min(retries * 1000, 10000);
    },
    connectTimeout: 10000, // 10 seconds timeout
    keepAlive: 3000
  }
});

redis.on("error", (err) => {
  console.error("⚠️ Redis Error:", err.message);
  
  // Agar production mein Redis nahi hai to bhi server chalne do
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    console.log("⚠️ Redis unavailable, running without Redis (limited functionality)");
  }
});

redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis Reconnecting...");
});

try {
  await redis.connect();
  console.log("✅ Redis Connected Successfully");
} catch (err) {
  console.error("❌ Failed to connect to Redis:", err.message);
  
  // Production mein Redis ke bina bhi server chal sakta hai (limited mode)
  if (process.env.NODE_ENV === 'production') {
    console.log("⚠️ Continuing without Redis - some features may be limited");
  } else {
    process.exit(1);
  }
}
```

## 🚀 **For Render.com Deployment**

### **Option 1: Use Redis Cloud (Recommended)**
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create free database (30MB)
3. Get connection URL like: `redis://default:password@host:port`
4. Add to Render environment variables:
```
REDIS_URL=redis://default:password@host:port
```

### **Option 2: Use Redis Labs Free**
```bash
# Get free Redis instance from:
https://app.redislabs.com/
```

### **Option 3: Disable Redis for Testing**
Temporary fix - comment out Redis code:

```javascript
/* =======================
   REDIS SETUP - DISABLED FOR TESTING
======================= */

console.log("⚠️ Redis disabled for testing");

// Mock Redis functions
const redis = {
  lPush: async () => 1,
  lRem: async () => 1,
  lLen: async () => 0,
  lRange: async () => [],
  keys: async () => [],
  hSet: async () => 'OK',
  expire: async () => true,
  incr: async () => 1,
  get: async () => '0',
  sAdd: async () => 1,
  sIsMember: async () => 0,
  ping: async () => 'PONG',
  quit: async () => 'OK'
};

console.log("✅ Redis Mock Mode Active");
```

## 📝 **Environment Variables for Render**

In Render dashboard, add:

```
REDIS_URL=redis://default:password@host:port
NODE_ENV=production
PORT=5000
```

## ✅ **Quick Production Fix**

Create `.env` file in production:

```bash
REDIS_URL=redis://your-redis-instance:6379
```

**Ya phir chahte ho main Redis cloud setup mein help karun?** 🚀