# 🥗 NutriSmart - Personalized AI Nutrition & Smart Ordering

NutriSmart is a premium full-stack platform that bridges the gap between restaurant ordering and personal health goals. Using real-time BMI analysis and health objective tracking, it provides personalized food recommendations, a 7-day meal planner, and a seamless ordering experience.

Website Link - https://nutri-smart-eat-smart-live-better-k-seven.vercel.app/

## ✨ Key Features

### 🧬 Smart Health Profiling
- **Live BMI Calculator**: Instant category assignment (Underweight, Normal, Overweight).
- **Goal Setting**: Tailored recommendations for Weight Loss, Maintenance, or Muscle Gain.

### 🍱 Intelligent Menu
- **AI-Driven Recommendations**: Rule-based filtering that highlights the best meals for your specific body type.
- **Nutritional Transparency**: View calories, protein, carbs, and fat for every single dish.
- **Smart Filters**: Filter by category (Low Calorie, Balanced, Indulgent) or tags (Vegan, Keto, etc.).

### 📅 Advanced Meal Planner
- **Drag-and-Drop Scheduling**: Plan your entire week in seconds.
- **Calorie Budgeting**: Stay within your daily health limits with real-time tracking.
- **Persistence**: Save and sync your plans across devices; "Copy from Last Week" functionality.

### 👑 Super Admin Dashboard
- **Business Analytics**: Track total sales, orders, and user growth at a glance.
- **Menu Management**: Full CRUD (Create, Read, Update, Delete) to manage restaurant inventory.
- **Order Monitoring**: Real-time view of all customer transactions.

---

## 🛠️ Tech Stack

### Frontend
- **React.js**: For a fast, responsive Single Page Application (SPA).
- **Tailwind CSS**: Utility-first styling for a sleek, modern UI.
- **Lucide React**: Premium iconography.
- **Context API**: State management for Auth and Shopping Cart.

### Backend
- **FastAPI (Python)**: High-performance asynchronous API framework.
- **Motor**: Async MongoDB driver for high-concurrency database access.
- **JWT (JSON Web Tokens)**: Secure, cross-domain authentication using HttpOnly cookies.
- **Bcrypt**: Industrial-strength password hashing.

### Database & Deployment
- **MongoDB Atlas**: Cloud-hosted NoSQL database.
- **Vercel**: Global frontend hosting with CI/CD.
- **Render**: Scalable backend hosting for Python services.

---

## 🚦 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB Atlas account

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file with MONGO_URL, DB_NAME, and JWT_SECRET
uvicorn server:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file with REACT_APP_BACKEND_URL
npm start
```

---

## 🔑 Test Credentials

| Account Type | Email | Password |
| :--- | :--- | :--- |
| **Demo User** | `demo@nutrismart.com` | `123456` |

---

## 🛡️ Security Features
- **CORS Protection**: Regex-based origin validation for secure cross-domain communication.
- **Hardened Cookies**: `SameSite=None` and `Secure=True` configurations for production reliability.
- **Protected Routes**: Middleware-level authorization checks for both User and Admin roles.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
**Developed with ❤️ by Kartik**
*NutriSmart – Eat Smart, Live Better*
