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


