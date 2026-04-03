"""Tests for email features: meal-plan-digest, weekly-report, and copy-from-last-week logic"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    resp = s.post(f"{BASE_URL}/api/auth/login", json={"email": "demo@nutrismart.com", "password": "123456"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return s

# Test meal-plan-digest endpoint
def test_email_meal_plan_digest_returns_preview(session):
    """POST /api/email/meal-plan-digest should return sent=false and preview_html in test mode"""
    from datetime import datetime, timedelta
    today = datetime.utcnow()
    day = today.weekday()
    monday = today - timedelta(days=day)
    week_start = monday.strftime("%Y-%m-%d")

    resp = session.post(f"{BASE_URL}/api/email/meal-plan-digest", json={"week_start": week_start})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "sent" in data, "Response missing 'sent' field"
    assert "preview_html" in data, "Response missing 'preview_html' field"
    assert "week_label" in data, "Response missing 'week_label' field"
    assert data["sent"] is False, "Expected sent=false in test mode"
    assert data["preview_html"], "preview_html should not be empty"
    assert "NutriSmart" in data["preview_html"], "Preview HTML should contain NutriSmart branding"
    print(f"✅ meal-plan-digest: sent={data['sent']}, week_label={data['week_label']}")

def test_email_meal_plan_digest_html_content(session):
    """Preview HTML should contain key email template elements"""
    from datetime import datetime, timedelta
    today = datetime.utcnow()
    day = today.weekday()
    monday = today - timedelta(days=day)
    week_start = monday.strftime("%Y-%m-%d")

    resp = session.post(f"{BASE_URL}/api/email/meal-plan-digest", json={"week_start": week_start})
    assert resp.status_code == 200
    html = resp.json()["preview_html"]
    assert "NutriSmart" in html, "HTML should have NutriSmart header"
    assert "FF6B35" in html, "HTML should have brand color"
    assert "View Full Planner" in html, "HTML should have CTA button"
    print("✅ meal-plan-digest HTML has branding and CTA")

def test_email_weekly_report_returns_preview(session):
    """POST /api/email/weekly-report should return sent=false and preview_html in test mode"""
    resp = session.post(f"{BASE_URL}/api/email/weekly-report", json={})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "sent" in data
    assert "preview_html" in data
    assert "week_label" in data
    assert data["sent"] is False
    assert data["preview_html"], "preview_html should not be empty"
    print(f"✅ weekly-report: sent={data['sent']}, week_label={data['week_label']}")

def test_email_weekly_report_html_content(session):
    """Weekly report HTML should contain stat cards and adherence section"""
    resp = session.post(f"{BASE_URL}/api/email/weekly-report", json={})
    assert resp.status_code == 200
    html = resp.json()["preview_html"]
    assert "kcal Planned" in html, "Should have planned calories stat"
    assert "kcal Ordered" in html, "Should have ordered calories stat"
    assert "Planned Spend" in html, "Should have planned spend stat"
    assert "Actually Spent" in html, "Should have actual spend stat"
    assert "Plan Adherence" in html, "Should have adherence section"
    assert "Plan Next Week" in html, "Should have CTA button"
    print("✅ weekly-report HTML has all 4 stat cards and adherence section")

def test_email_meal_plan_digest_requires_auth():
    """Email endpoints should require authentication"""
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/email/meal-plan-digest", json={"week_start": "2025-01-06"})
    assert resp.status_code == 401, f"Expected 401 for unauthenticated request, got {resp.status_code}"
    print("✅ meal-plan-digest requires auth")

def test_email_weekly_report_requires_auth():
    """Email weekly-report should require authentication"""
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/email/weekly-report", json={})
    assert resp.status_code == 401, f"Expected 401 for unauthenticated request, got {resp.status_code}"
    print("✅ weekly-report requires auth")

def test_meal_plan_get_last_week(session):
    """GET /api/meal-plan with week_start param (used by Copy from Last Week)"""
    from datetime import datetime, timedelta
    today = datetime.utcnow()
    day = today.weekday()
    last_monday = today - timedelta(days=day + 7)
    last_week_key = last_monday.strftime("%Y-%m-%d")
    resp = session.get(f"{BASE_URL}/api/meal-plan?week_start={last_week_key}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "plan" in data, "Response should have 'plan' key"
    assert "week_start" in data, "Response should have 'week_start' key"
    print(f"✅ GET last week plan: week_start={data.get('week_start')}, plan_days={list(data['plan'].keys())}")
