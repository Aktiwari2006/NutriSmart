from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import bcrypt
import jwt
import logging
import uuid
from emergentintegrations.llm.chat import LlmChat, UserMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="NutriSmart API")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "https://wellness-plate-order.preview.emergentagent.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PyObjectId ────────────────────────────────────────────────────────────────
def _coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(_coerce_objectid)]

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ── Pydantic Models ───────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class BMIUpdateRequest(BaseModel):
    height: float
    weight: float
    goal: Optional[str] = "maintain"

class MenuItemCreate(BaseModel):
    name: str
    description: str
    image_url: str
    price: float
    calories: int
    protein: float
    carbs: float
    fat: float
    tags: List[str] = []
    category: str  # low_calorie / balanced / high_calorie
    is_available: bool = True

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None

class OrderItemModel(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    calories: int

class PlaceOrderRequest(BaseModel):
    items: List[OrderItemModel]
    total_amount: float
    delivery_address: Optional[str] = "Demo Address"
    payment_method: str = "mock"

class MockPaymentRequest(BaseModel):
    order_id: str
    amount: float

# ── Seed Data ─────────────────────────────────────────────────────────────────
SEED_MENU_ITEMS = [
    # Low Calorie (Green)
    {
        "name": "Garden Salad Bowl",
        "description": "Fresh greens, cherry tomatoes, cucumber, and light vinaigrette",
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
        "price": 199,
        "calories": 220,
        "protein": 8.0,
        "carbs": 25.0,
        "fat": 10.0,
        "tags": ["Vegan", "Low Calorie", "Gluten Free"],
        "category": "low_calorie",
        "is_available": True,
    },
    {
        "name": "Grilled Chicken Salad",
        "description": "Tender grilled chicken over mixed greens with lemon dressing",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
        "price": 299,
        "calories": 320,
        "protein": 35.0,
        "carbs": 15.0,
        "fat": 8.0,
        "tags": ["High Protein", "Low Calorie", "Keto Friendly"],
        "category": "low_calorie",
        "is_available": True,
    },
    {
        "name": "Moong Dal Soup",
        "description": "Nutritious yellow lentil soup with ginger, turmeric and cumin",
        "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
        "price": 149,
        "calories": 200,
        "protein": 12.0,
        "carbs": 30.0,
        "fat": 3.0,
        "tags": ["Vegan", "Low Calorie", "High Protein"],
        "category": "low_calorie",
        "is_available": True,
    },
    {
        "name": "Idli Sambhar",
        "description": "Steamed rice cakes with spiced lentil stew and coconut chutney",
        "image_url": "https://images.unsplash.com/photo-1567337710282-00832b415979?w=500&auto=format&fit=crop&q=80",
        "price": 129,
        "calories": 350,
        "protein": 10.0,
        "carbs": 60.0,
        "fat": 5.0,
        "tags": ["Vegan", "Low Calorie", "South Indian"],
        "category": "low_calorie",
        "is_available": True,
    },
    {
        "name": "Sprouts Chaat",
        "description": "Mixed sprouts with onion, tomato, lemon juice and chaat masala",
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
        "price": 119,
        "calories": 180,
        "protein": 9.0,
        "carbs": 28.0,
        "fat": 2.0,
        "tags": ["Vegan", "Low Calorie", "High Fiber"],
        "category": "low_calorie",
        "is_available": True,
    },
    # Balanced (Yellow)
    {
        "name": "Dal Tadka with Jeera Rice",
        "description": "Classic yellow dal tempered with ghee, garlic, and cumin rice",
        "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80",
        "price": 219,
        "calories": 490,
        "protein": 18.0,
        "carbs": 80.0,
        "fat": 10.0,
        "tags": ["Vegetarian", "Balanced", "High Fiber"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Chicken Tikka Bowl",
        "description": "Tandoor-marinated chicken tikka with mint chutney and salad",
        "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=80",
        "price": 349,
        "calories": 520,
        "protein": 42.0,
        "carbs": 35.0,
        "fat": 18.0,
        "tags": ["High Protein", "Balanced", "Grilled"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Paneer Bhurji with Roti",
        "description": "Scrambled cottage cheese with onions, peppers and 2 whole wheat rotis",
        "image_url": "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=500&auto=format&fit=crop&q=80",
        "price": 279,
        "calories": 580,
        "protein": 22.0,
        "carbs": 65.0,
        "fat": 22.0,
        "tags": ["Vegetarian", "Balanced", "High Protein"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Vegetable Biryani",
        "description": "Fragrant basmati rice cooked with seasonal vegetables and whole spices",
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
        "price": 249,
        "calories": 540,
        "protein": 12.0,
        "carbs": 85.0,
        "fat": 14.0,
        "tags": ["Vegan", "Balanced", "Dum Cooked"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Avocado Toast with Egg",
        "description": "Sourdough toast with smashed avocado, poached egg and microgreens",
        "image_url": "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&auto=format&fit=crop&q=80",
        "price": 279,
        "calories": 420,
        "protein": 16.0,
        "carbs": 35.0,
        "fat": 22.0,
        "tags": ["Balanced", "High Protein", "Healthy Fats"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Grilled Fish with Veggies",
        "description": "Lemon-herb grilled fish fillet with steamed broccoli and carrots",
        "image_url": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80",
        "price": 399,
        "calories": 450,
        "protein": 45.0,
        "carbs": 25.0,
        "fat": 15.0,
        "tags": ["High Protein", "Balanced", "Omega-3 Rich"],
        "category": "balanced",
        "is_available": True,
    },
    {
        "name": "Quinoa Power Bowl",
        "description": "Quinoa with roasted veggies, chickpeas, tahini and pumpkin seeds",
        "image_url": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop&q=80",
        "price": 329,
        "calories": 480,
        "protein": 20.0,
        "carbs": 65.0,
        "fat": 12.0,
        "tags": ["Vegan", "Balanced", "High Fiber", "Gluten Free"],
        "category": "balanced",
        "is_available": True,
    },
    # High Calorie (Red)
    {
        "name": "Butter Chicken with Naan",
        "description": "Rich, creamy tomato butter chicken gravy with 2 butter naans",
        "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80",
        "price": 399,
        "calories": 750,
        "protein": 42.0,
        "carbs": 70.0,
        "fat": 28.0,
        "tags": ["High Calorie", "High Protein", "Indian Classic"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Double Cheese Burger",
        "description": "Two beef patties, double cheddar, lettuce, tomato, secret sauce",
        "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        "price": 349,
        "calories": 820,
        "protein": 45.0,
        "carbs": 65.0,
        "fat": 40.0,
        "tags": ["High Calorie", "High Protein", "Cheat Meal"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Chicken Biryani",
        "description": "Slow-cooked basmati rice with succulent chicken in aromatic spices",
        "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
        "price": 349,
        "calories": 720,
        "protein": 38.0,
        "carbs": 90.0,
        "fat": 18.0,
        "tags": ["High Calorie", "High Protein", "Dum Biryani"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Pepperoni Pizza",
        "description": "Wood-fired pizza with mozzarella, pepperoni and tomato sauce",
        "image_url": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80",
        "price": 449,
        "calories": 760,
        "protein": 32.0,
        "carbs": 80.0,
        "fat": 32.0,
        "tags": ["High Calorie", "Cheesy", "Cheat Meal"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Pav Bhaji",
        "description": "Spiced vegetable mash with 4 buttered pavs – Mumbai street style",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
        "price": 199,
        "calories": 720,
        "protein": 15.0,
        "carbs": 100.0,
        "fat": 25.0,
        "tags": ["High Calorie", "Vegetarian", "Street Food"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Creamy Pasta Alfredo",
        "description": "Fettuccine in rich parmesan cream sauce with grilled chicken",
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=80",
        "price": 399,
        "calories": 780,
        "protein": 28.0,
        "carbs": 85.0,
        "fat": 35.0,
        "tags": ["High Calorie", "Creamy", "Italian"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Chole Bhature",
        "description": "Spiced chickpea curry with fluffy deep-fried bread – Punjabi special",
        "image_url": "https://images.unsplash.com/photo-1626504441890-3a6a02c5dc19?w=500&auto=format&fit=crop&q=80",
        "price": 229,
        "calories": 850,
        "protein": 18.0,
        "carbs": 110.0,
        "fat": 35.0,
        "tags": ["High Calorie", "Vegetarian", "Street Food"],
        "category": "high_calorie",
        "is_available": True,
    },
    {
        "name": "Full English Breakfast",
        "description": "Eggs, bacon, sausages, beans, grilled tomato and toast",
        "image_url": "https://images.unsplash.com/photo-1533089860892-a7c6f10a081a?w=500&auto=format&fit=crop&q=80",
        "price": 499,
        "calories": 850,
        "protein": 38.0,
        "carbs": 55.0,
        "fat": 45.0,
        "tags": ["High Calorie", "High Protein", "Breakfast"],
        "category": "high_calorie",
        "is_available": True,
    },
]

DEMO_ORDERS = [
    {
        "items": [
            {"item_id": "seed1", "name": "Grilled Chicken Salad", "price": 299, "quantity": 1, "calories": 320},
            {"item_id": "seed2", "name": "Moong Dal Soup", "price": 149, "quantity": 2, "calories": 200},
        ],
        "total_amount": 597,
        "delivery_address": "123 Demo Street, Mumbai",
        "payment_method": "mock",
        "status": "delivered",
        "payment_status": "paid",
    },
    {
        "items": [
            {"item_id": "seed3", "name": "Quinoa Power Bowl", "price": 329, "quantity": 1, "calories": 480},
        ],
        "total_amount": 329,
        "delivery_address": "123 Demo Street, Mumbai",
        "payment_method": "mock",
        "status": "delivered",
        "payment_status": "paid",
    },
]

async def seed_database():
    """Seed admin, demo user, and menu items."""
    # Seed Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@nutrismart.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "NutriSmart Admin",
            "role": "admin",
            "bmi_data": None,
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, admin.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed Demo User
    demo_email = os.environ.get("DEMO_EMAIL", "demo@nutrismart.com")
    demo_password = os.environ.get("DEMO_PASSWORD", "123456")
    demo_user = await db.users.find_one({"email": demo_email})
    if not demo_user:
        demo_id = await db.users.insert_one({
            "email": demo_email,
            "password_hash": hash_password(demo_password),
            "name": "Demo User",
            "role": "user",
            "bmi_data": {"height": 170, "weight": 68, "goal": "maintain", "bmi": 23.5, "category": "normal"},
            "created_at": datetime.now(timezone.utc),
        })
        # Seed demo orders
        for order in DEMO_ORDERS:
            await db.orders.insert_one({
                **order,
                "user_id": str(demo_id.inserted_id),
                "created_at": datetime.now(timezone.utc) - timedelta(days=len(DEMO_ORDERS)),
            })
        logger.info("Demo user seeded")
    
    # Seed Menu Items
    count = await db.menu_items.count_documents({})
    if count == 0:
        await db.menu_items.insert_many([
            {**item, "created_at": datetime.now(timezone.utc)} for item in SEED_MENU_ITEMS
        ])
        logger.info(f"Seeded {len(SEED_MENU_ITEMS)} menu items")

    # Write test credentials
    import os as _os
    _os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# NutriSmart Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Demo User Account
- Email: {demo_email}
- Password: {demo_password}
- Role: user
- Pre-filled BMI: 23.5 (Normal, Goal: Maintain)

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
""")

# ── AUTH ROUTES ───────────────────────────────────────────────────────────────
@api_router.post("/auth/register")
async def register(data: RegisterRequest):
    from fastapi.responses import JSONResponse
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "user",
        "bmi_data": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email, "user")
    resp = JSONResponse(content={"id": user_id, "email": email, "name": data.name, "role": "user", "bmi_data": None})
    resp.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return resp

@api_router.post("/auth/login")
async def login(data: LoginRequest):
    from fastapi.responses import JSONResponse
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email, user.get("role", "user"))
    resp = JSONResponse(content={
        "id": user_id,
        "email": email,
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "bmi_data": user.get("bmi_data"),
    })
    resp.set_cookie("access_token", token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return resp

@api_router.post("/auth/logout")
async def logout():
    from fastapi.responses import JSONResponse
    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie("access_token", path="/")
    return resp

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# ── PROFILE / BMI ROUTES ──────────────────────────────────────────────────────
@api_router.put("/profile/bmi")
async def update_bmi(data: BMIUpdateRequest, request: Request):
    user = await get_current_user(request)
    height_m = data.height / 100
    bmi = round(data.weight / (height_m ** 2), 1)
    if bmi < 18.5:
        category = "underweight"
    elif bmi < 25:
        category = "normal"
    else:
        category = "overweight"
    bmi_data = {
        "height": data.height,
        "weight": data.weight,
        "goal": data.goal,
        "bmi": bmi,
        "category": category,
    }
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"bmi_data": bmi_data}})
    return {"bmi": bmi, "category": category, "bmi_data": bmi_data}

# ── MENU ROUTES ───────────────────────────────────────────────────────────────
@api_router.get("/menu")
async def get_menu(category: Optional[str] = None, tag: Optional[str] = None):
    query = {"is_available": True}
    if category:
        query["category"] = category
    if tag:
        query["tags"] = {"$in": [tag]}
    items = await db.menu_items.find(query).to_list(100)
    result = []
    for item in items:
        item["id"] = str(item["_id"])
        item.pop("_id", None)
        result.append(item)
    return result

@api_router.get("/menu/{item_id}")
async def get_menu_item(item_id: str):
    try:
        item = await db.menu_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item["id"] = str(item["_id"])
    item.pop("_id", None)
    return item

# ── RECOMMENDATION ROUTES ─────────────────────────────────────────────────────
@api_router.get("/recommendations")
async def get_recommendations(request: Request):
    user = await get_current_user(request)
    bmi_data = user.get("bmi_data")

    # Get menu items
    all_items = await db.menu_items.find({"is_available": True}).to_list(100)
    for item in all_items:
        item["id"] = str(item["_id"])
        item.pop("_id", None)

    if not bmi_data:
        # Return balanced items as default
        recs = [i for i in all_items if i["category"] == "balanced"][:6]
        return {"recommendations": recs, "reason": "Complete your BMI profile for personalized recommendations!", "ai_tip": None}

    category = bmi_data.get("category", "normal")
    goal = bmi_data.get("goal", "maintain")
    bmi = bmi_data.get("bmi", 22)

    # Rule-based filtering
    if category == "underweight" or goal == "gain":
        target_cats = ["high_calorie", "balanced"]
    elif category == "overweight" or goal == "lose":
        target_cats = ["low_calorie", "balanced"]
    else:
        target_cats = ["balanced", "low_calorie"]

    recs = [i for i in all_items if i["category"] == target_cats[0]][:4]
    recs += [i for i in all_items if i["category"] == target_cats[1]][:2]

    # AI tip via LLM
    ai_tip = None
    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY", ""),
            session_id=f"rec-{user['_id']}-{uuid.uuid4()}",
            system_message="You are a certified nutritionist. Give a concise, personalized, actionable dietary tip in 2 sentences max. Be warm and motivating."
        ).with_model("openai", "gpt-4.1-mini")

        msg = UserMessage(
            text=f"User BMI: {bmi} ({category}), Goal: {goal}. Give a personalized nutrition tip for their restaurant ordering today."
        )
        ai_tip = await chat.send_message(msg)
    except Exception as e:
        logger.warning(f"AI tip failed: {e}")
        ai_tip = f"Based on your BMI of {bmi} ({category}), focus on {'calorie-dense, protein-rich meals' if category == 'underweight' else 'light, nutrient-dense options' if category == 'overweight' else 'balanced meals with adequate protein and fiber'}."

    return {
        "recommendations": recs[:6],
        "reason": f"Personalized for your BMI ({bmi} – {category.title()}) and goal ({goal.title()})",
        "ai_tip": ai_tip,
    }

# ── ORDER ROUTES ──────────────────────────────────────────────────────────────
@api_router.post("/orders")
async def place_order(data: PlaceOrderRequest, request: Request):
    user = await get_current_user(request)
    order_doc = {
        "user_id": user["_id"],
        "items": [i.dict() for i in data.items],
        "total_amount": data.total_amount,
        "delivery_address": data.delivery_address,
        "payment_method": data.payment_method,
        "status": "pending",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)
    return {"order_id": order_id, "status": "pending", "message": "Order placed successfully"}

@api_router.get("/orders")
async def get_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(50)
    result = []
    for o in orders:
        o["id"] = str(o["_id"])
        o.pop("_id", None)
        if isinstance(o.get("created_at"), datetime):
            o["created_at"] = o["created_at"].isoformat()
        result.append(o)
    return result

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    order["id"] = str(order["_id"])
    order.pop("_id", None)
    if isinstance(order.get("created_at"), datetime):
        order["created_at"] = order["created_at"].isoformat()
    return order

# ── PAYMENT ROUTES ────────────────────────────────────────────────────────────
@api_router.post("/payment/mock")
async def mock_payment(data: MockPaymentRequest, request: Request):
    user = await get_current_user(request)
    try:
        await db.orders.update_one(
            {"_id": ObjectId(data.order_id)},
            {"$set": {"status": "confirmed", "payment_status": "paid", "paid_at": datetime.now(timezone.utc)}}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "success": True,
        "transaction_id": f"MOCK-{uuid.uuid4().hex[:12].upper()}",
        "message": "Payment successful! Your order is confirmed.",
        "order_id": data.order_id,
    }

# ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
@api_router.post("/admin/menu")
async def admin_create_menu_item(data: MenuItemCreate, request: Request):
    await get_admin_user(request)
    item_doc = {**data.dict(), "created_at": datetime.now(timezone.utc)}
    result = await db.menu_items.insert_one(item_doc)
    return {"id": str(result.inserted_id), "message": "Menu item created"}

@api_router.put("/admin/menu/{item_id}")
async def admin_update_menu_item(item_id: str, data: MenuItemUpdate, request: Request):
    await get_admin_user(request)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        await db.menu_items.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    except Exception:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Updated successfully"}

@api_router.delete("/admin/menu/{item_id}")
async def admin_delete_menu_item(item_id: str, request: Request):
    await get_admin_user(request)
    try:
        await db.menu_items.delete_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted successfully"}

@api_router.get("/admin/orders")
async def admin_get_orders(request: Request):
    await get_admin_user(request)
    orders = await db.orders.find({}).sort("created_at", -1).to_list(100)
    result = []
    for o in orders:
        o["id"] = str(o["_id"])
        o.pop("_id", None)
        if isinstance(o.get("created_at"), datetime):
            o["created_at"] = o["created_at"].isoformat()
        result.append(o)
    return result

@api_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    await get_admin_user(request)
    total_users = await db.users.count_documents({"role": "user"})
    total_orders = await db.orders.count_documents({})
    total_menu = await db.menu_items.count_documents({})
    paid_orders = await db.orders.find({"payment_status": "paid"}).to_list(1000)
    total_revenue = sum(o.get("total_amount", 0) for o in paid_orders)
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_menu_items": total_menu,
        "total_revenue": total_revenue,
    }

@api_router.get("/admin/menu")
async def admin_get_menu(request: Request):
    await get_admin_user(request)
    items = await db.menu_items.find({}).to_list(100)
    result = []
    for item in items:
        item["id"] = str(item["_id"])
        item.pop("_id", None)
        result.append(item)
    return result

# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
@api_router.get("/")
async def health():
    return {"status": "ok", "app": "NutriSmart API"}

# ── Register router ───────────────────────────────────────────────────────────
app.include_router(api_router)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.menu_items.create_index("category")
    await seed_database()
    logger.info("NutriSmart API started")
