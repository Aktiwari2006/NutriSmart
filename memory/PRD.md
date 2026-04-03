# NutriSmart – Health-Based Restaurant Ordering System

## Problem Statement
Build a full-stack, production-ready web application called "NutriSmart" — a smart restaurant ordering platform that recommends food items to users based on their BMI, health goals, and nutritional needs, with seamless ordering and payment.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui components
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Auth**: JWT (httpOnly cookies)
- **AI**: OpenAI GPT via emergentintegrations (Emergent LLM Key)
- **Payment**: Mock/Demo payment only

## User Choices
- Light theme (Zomato/Swiggy inspired)
- Mock/Demo payment only
- AI/LLM recommendations (OpenAI GPT-4.1 mini)
- Curated Unsplash direct URLs for images
- FastAPI (Python) backend instead of Node.js

## What's Been Implemented (April 2026)

### Backend (/app/backend/server.py)
- JWT Auth: register, login, logout, /me, cookies
- BCrypt password hashing
- BMI calculation API with category assignment
- Menu CRUD with seed data (20 items)
- AI recommendations via OpenAI GPT-4.1-mini (emergentintegrations)
- Order placement & retrieval
- Mock payment endpoint
- Admin panel APIs (menu CRUD, orders, stats)
- Startup seeding (admin, demo user, 20 menu items, 2 demo orders)

### Frontend
- Landing Page: hero, features, How It Works, stats, CTA
- Auth: Login + Signup + Demo login button
- BMI Setup: height/weight/goal input with live BMI preview
- Menu Page: tabs (For You / Full Menu), filters, search, add to cart
- Food Cards: nutritional info, color-coded health badges
- Cart Page: quantity controls, total, calories
- Checkout Page: address, mock payment, order placement
- Order Confirmation: success screen with transaction ID
- User Dashboard: BMI card, calorie chart, order history
- Admin Panel: stats, menu management (add/edit/delete), orders view
- Navbar with cart count, responsive mobile menu

## Seed Data
- 20 food items (5 low-calorie, 8 balanced, 7 high-calorie)
- Demo User: demo@nutrismart.com / 123456
- Admin User: admin@nutrismart.com / admin123

## Test Credentials
See /app/memory/test_credentials.md

## Prioritized Backlog

### P0 (Implemented)
- [x] Auth (login/signup/demo/admin)
- [x] BMI calculation & storage
- [x] Menu with nutritional info
- [x] AI recommendations
- [x] Cart & order system
- [x] Mock payment
- [x] Admin panel
- [x] User dashboard
- [x] Meal Planner (weekly, daily budget, calorie tracking, persist to DB)

### P1 (Next Phase)
- [ ] Password reset via email (Resend integration)
- [ ] Real Razorpay payment integration
- [ ] Order status tracking (real-time)
- [ ] Search with autocomplete
- [ ] Favorites/bookmarks system
- [ ] Mobile PWA support

### P2 (Future)
- [ ] Calorie tracking over time with charts
- [ ] Meal plan builder
- [ ] Social sharing (share your healthy meal)
- [ ] Restaurant reviews
- [ ] AI chatbot for nutrition advice
- [ ] Multiple restaurant support

## Next Tasks
1. Test full user flow end-to-end
2. Consider adding Razorpay for real payments
3. Add email notifications via Resend
4. PWA manifest for mobile app-like experience
