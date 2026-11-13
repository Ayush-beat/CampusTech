import pytest
from decimal import Decimal

def test_unauthenticated_access_blocked(client):
    """
    Test 2 & 4: Unauthenticated visitors cannot access protected financial routes.
    """
    protected_endpoints = [
        "/api/expenses",
        "/api/expenses/1",
        "/api/budgets",
        "/api/analytics/dashboard",
        "/api/analytics/trend",
        "/api/analytics/health",
        "/api/reports/summary",
        "/api/reports/csv",
        "/api/planning/semester",
        "/api/planning/savings-goals",
        "/api/planning/subscriptions",
        "/api/insights",
        "/api/assistant/ask"
    ]
    for ep in protected_endpoints:
        if ep == "/api/assistant/ask":
            res = client.post(ep, json={"query": "safe to spend"})
        else:
            res = client.get(ep)
        assert res.status_code == 401, f"Expected 401 Unauthorized for {ep}, got {res.status_code}"

def test_user_data_isolation_cross_user_forbidden(client):
    """
    Test 5 & 6: User A cannot retrieve User B's expenses by changing a URL, ID, or parameter.
    Analytics, budgets, and reports remain strictly scoped to the authenticated user.
    """
    # 1. Register User A
    user_a_res = client.post("/api/auth/register", json={
        "email": "student.alpha@college.edu",
        "password": "Password123!",
        "full_name": "Alpha Student",
        "college_name": "Tech University",
        "currency": "INR"
    })
    assert user_a_res.status_code == 201
    token_a = user_a_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User A records an expense
    exp_a_res = client.post("/api/expenses", json={
        "amount": 750.00,
        "description": "Alpha Private Textbook",
        "date": "2026-10-10",
        "payment_method": "UPI",
        "notes": "Alpha secret research material"
    }, headers=headers_a)
    assert exp_a_res.status_code == 201
    exp_a_id = exp_a_res.json()["id"]

    # 2. Register User B
    user_b_res = client.post("/api/auth/register", json={
        "email": "student.beta@college.edu",
        "password": "Password123!",
        "full_name": "Beta Student",
        "college_name": "Science Campus",
        "currency": "INR"
    })
    assert user_b_res.status_code == 201
    token_b = user_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User B attempts to access User A's expense by direct ID -> MUST BE 404
    direct_get_res = client.get(f"/api/expenses/{exp_a_id}", headers=headers_b)
    assert direct_get_res.status_code == 404, "User B must not read User A's expense by ID"

    # 4. User B attempts to edit User A's expense by direct ID -> MUST BE 404
    direct_put_res = client.put(f"/api/expenses/{exp_a_id}", json={
        "amount": 10.00,
        "description": "Hacked description"
    }, headers=headers_b)
    assert direct_put_res.status_code == 404, "User B must not update User A's expense"

    # 5. User B attempts to delete User A's expense by direct ID -> MUST BE 404
    direct_del_res = client.delete(f"/api/expenses/{exp_a_id}", headers=headers_b)
    assert direct_del_res.status_code == 404, "User B must not delete User A's expense"

    # 6. User B lists expenses -> MUST contain 0 items (User A's expense never leaks)
    list_b_res = client.get("/api/expenses", headers=headers_b)
    assert list_b_res.status_code == 200
    assert list_b_res.json()["total"] == 0
    assert len(list_b_res.json()["items"]) == 0

    # 7. User B dashboard analytics -> Total expenses must be 0.00
    dash_b_res = client.get("/api/analytics/dashboard", headers=headers_b)
    assert dash_b_res.status_code == 200
    dash_b_data = dash_b_res.json()
    assert float(dash_b_data["financial_summary"]["total_expenses"]) == 0.0
    assert len(dash_b_data["recent_transactions"]) == 0

    # 8. User B CSV export -> Must not contain User A's transaction
    csv_b_res = client.get("/api/reports/csv", headers=headers_b)
    assert csv_b_res.status_code == 200
    csv_text = csv_b_res.text
    assert "Alpha Private Textbook" not in csv_text
    assert "Alpha secret research material" not in csv_text

def test_fresh_account_empty_states_no_invented_figures(client):
    """
    Test 11: Fresh user has 0 spent, clean empty state, and no fabricated figures.
    """
    res = client.post("/api/auth/register", json={
        "email": "empty.account@college.edu",
        "password": "Password123!",
        "full_name": "Empty State Student",
        "college_name": "Test University",
        "currency": "INR"
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash = client.get("/api/analytics/dashboard", headers=headers).json()
    assert float(dash["financial_summary"]["total_expenses"]) == 0.0
    assert len(dash["recent_transactions"]) == 0
    assert len(dash["upcoming_expenses"]) == 0
