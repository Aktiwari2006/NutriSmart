"""NutriSmart API backend tests"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Auth fixtures
@pytest.fixture(scope="module")
def demo_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "demo@nutrismart.com", "password": "123456"})
    assert r.status_code == 200, f"Demo login failed: {r.text}"
    return s

@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@nutrismart.com", "password": "admin123"})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s

# ── Auth Tests ─────────────────────────────────────────────────────────────────
class TestAuth:
    def test_demo_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "demo@nutrismart.com", "password": "123456"})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "demo@nutrismart.com"
        assert data["role"] == "user"

    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@nutrismart.com", "password": "admin123"})
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"

    def test_invalid_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
        assert r.status_code == 401

    def test_register_new_user(self):
        uid = uuid.uuid4().hex[:8]
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_{uid}@test.com", "name": "Test User", "password": "testpass123"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "user"
        assert data["bmi_data"] is None

    def test_get_me(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == "demo@nutrismart.com"

# ── Menu Tests ─────────────────────────────────────────────────────────────────
class TestMenu:
    def test_get_menu_returns_20_items(self):
        r = requests.get(f"{BASE_URL}/api/menu")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 20, f"Expected 20 items, got {len(data)}"

    def test_menu_items_have_required_fields(self):
        r = requests.get(f"{BASE_URL}/api/menu")
        items = r.json()
        for item in items[:3]:
            assert "id" in item
            assert "name" in item
            assert "price" in item
            assert "calories" in item
            assert "category" in item

    def test_menu_filter_by_category(self):
        for cat in ["low_calorie", "balanced", "high_calorie"]:
            r = requests.get(f"{BASE_URL}/api/menu?category={cat}")
            assert r.status_code == 200
            items = r.json()
            assert len(items) > 0
            for item in items:
                assert item["category"] == cat

# ── Recommendations Tests ──────────────────────────────────────────────────────
class TestRecommendations:
    def test_recommendations_returns_data(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/recommendations")
        assert r.status_code == 200
        data = r.json()
        assert "recommendations" in data
        assert len(data["recommendations"]) <= 6
        assert "ai_tip" in data

    def test_recommendations_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/recommendations")
        assert r.status_code == 401

# ── Orders Tests ───────────────────────────────────────────────────────────────
class TestOrders:
    def test_place_order(self, demo_session):
        r = demo_session.post(f"{BASE_URL}/api/orders", json={
            "items": [{"item_id": "test1", "name": "Garden Salad Bowl", "price": 199, "quantity": 1, "calories": 220}],
            "total_amount": 199,
            "delivery_address": "TEST address",
            "payment_method": "mock"
        })
        assert r.status_code == 200
        data = r.json()
        assert "order_id" in data
        return data["order_id"]

    def test_get_orders(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/orders")
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)

    def test_mock_payment(self, demo_session):
        # Place order first
        r = demo_session.post(f"{BASE_URL}/api/orders", json={
            "items": [{"item_id": "test1", "name": "Test Item", "price": 299, "quantity": 2, "calories": 320}],
            "total_amount": 598,
            "payment_method": "mock"
        })
        order_id = r.json()["order_id"]
        # Pay
        r2 = demo_session.post(f"{BASE_URL}/api/payment/mock", json={"order_id": order_id, "amount": 598})
        assert r2.status_code == 200
        data = r2.json()
        assert data["success"] is True
        assert "transaction_id" in data
        assert data["transaction_id"].startswith("MOCK-")

# ── Admin Tests ────────────────────────────────────────────────────────────────
class TestAdmin:
    def test_admin_get_menu(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/menu")
        assert r.status_code == 200
        assert len(r.json()) >= 20

    def test_admin_get_orders(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/orders")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_get_stats(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_users" in data
        assert "total_orders" in data
        assert "total_revenue" in data

    def test_admin_create_and_delete_menu_item(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/admin/menu", json={
            "name": "TEST_Item", "description": "Test desc", "image_url": "https://example.com/img.jpg",
            "price": 100, "calories": 200, "protein": 10.0, "carbs": 20.0, "fat": 5.0,
            "tags": ["Test"], "category": "balanced", "is_available": True
        })
        assert r.status_code == 200
        item_id = r.json()["id"]
        # Delete
        d = admin_session.delete(f"{BASE_URL}/api/admin/menu/{item_id}")
        assert d.status_code == 200

    def test_non_admin_cannot_access_admin_routes(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/admin/orders")
        assert r.status_code == 403

# ── Health Check ───────────────────────────────────────────────────────────────
def test_health():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
