"""Meal Planner API tests - GET/PUT /api/meal-plan"""
import pytest
import requests
import os
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

def get_monday():
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()

@pytest.fixture(scope="module")
def auth_session():
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": "demo@nutrismart.com", "password": "123456"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return session

class TestMealPlanAPI:
    """Meal Plan GET and PUT endpoint tests"""

    def test_get_meal_plan_no_week(self, auth_session):
        """GET without week_start returns latest or empty plan"""
        r = auth_session.get(f"{BASE_URL}/api/meal-plan")
        assert r.status_code == 200
        data = r.json()
        assert "plan" in data
        assert isinstance(data["plan"], dict)

    def test_get_meal_plan_with_week(self, auth_session):
        """GET with week_start returns plan for that week"""
        week = get_monday()
        r = auth_session.get(f"{BASE_URL}/api/meal-plan?week_start={week}")
        assert r.status_code == 200
        data = r.json()
        assert "plan" in data
        assert "daily_budget" in data or data.get("plan") is not None

    def test_put_meal_plan_saves(self, auth_session):
        """PUT saves plan and GET retrieves it"""
        week = get_monday()
        payload = {
            "week_start": week,
            "daily_budget": 1800,
            "plan": {
                "monday": [
                    {"item_id": "test1", "name": "Test Salad", "calories": 300, "protein": 20, "carbs": 30, "fat": 5, "price": 120, "image_url": ""}
                ]
            }
        }
        put_r = auth_session.put(f"{BASE_URL}/api/meal-plan", json=payload)
        assert put_r.status_code == 200

        # Verify persistence
        get_r = auth_session.get(f"{BASE_URL}/api/meal-plan?week_start={week}")
        assert get_r.status_code == 200
        data = get_r.json()
        assert "monday" in data["plan"]
        assert len(data["plan"]["monday"]) == 1
        assert data["plan"]["monday"][0]["name"] == "Test Salad"

    def test_put_meal_plan_update(self, auth_session):
        """PUT updates existing plan (idempotent)"""
        week = get_monday()
        payload = {
            "week_start": week,
            "daily_budget": 2000,
            "plan": {
                "monday": [
                    {"item_id": "t1", "name": "Item1", "calories": 400, "protein": 25, "carbs": 40, "fat": 8, "price": 150, "image_url": ""},
                    {"item_id": "t2", "name": "Item2", "calories": 500, "protein": 30, "carbs": 50, "fat": 10, "price": 180, "image_url": ""}
                ],
                "tuesday": []
            }
        }
        r = auth_session.put(f"{BASE_URL}/api/meal-plan", json=payload)
        assert r.status_code == 200

        get_r = auth_session.get(f"{BASE_URL}/api/meal-plan?week_start={week}")
        data = get_r.json()
        assert len(data["plan"]["monday"]) == 2
        assert data.get("daily_budget") == 2000

    def test_put_removes_items(self, auth_session):
        """PUT with empty day clears meals for that day"""
        week = get_monday()
        # Clear monday
        payload = {
            "week_start": week,
            "daily_budget": 1800,
            "plan": {"monday": []}
        }
        r = auth_session.put(f"{BASE_URL}/api/meal-plan", json=payload)
        assert r.status_code == 200

        get_r = auth_session.get(f"{BASE_URL}/api/meal-plan?week_start={week}")
        data = get_r.json()
        assert data["plan"].get("monday", []) == []

    def test_unauthenticated_get_fails(self):
        """Unauthenticated request returns 401"""
        r = requests.get(f"{BASE_URL}/api/meal-plan")
        assert r.status_code == 401

    def test_unauthenticated_put_fails(self):
        """Unauthenticated PUT returns 401"""
        r = requests.put(f"{BASE_URL}/api/meal-plan", json={"week_start": get_monday(), "daily_budget": 1800, "plan": {}})
        assert r.status_code == 401
