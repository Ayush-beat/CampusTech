def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_and_login(client):
    reg_payload = {
        "email": "riya.verma@college.edu",
        "password": "SecurePassword123",
        "full_name": "Riya Verma",
        "college_name": "BITS Pilani",
        "student_id": "2024-BP-102",
        "currency": "INR"
    }
    # Register
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "riya.verma@college.edu"

    # Login
    login_payload = {
        "email": "riya.verma@college.edu",
        "password": "SecurePassword123"
    }
    res_login = client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch current user
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["full_name"] == "Riya Verma"

    # Create Expense
    exp_payload = {
        "amount": 240.50,
        "description": "Library study materials",
        "date": "2026-10-15",
        "payment_method": "UPI",
        "notes": "Purchased near campus gate"
    }
    res_exp = client.post("/api/expenses", json=exp_payload, headers=headers)
    assert res_exp.status_code == 201
    exp_data = res_exp.json()
    assert float(exp_data["amount"]) == 240.50

    # Query Assistant
    query_payload = {"query": "How much did I spend this month?"}
    res_query = client.post("/api/assistant/ask", json=query_payload, headers=headers)
    assert res_query.status_code == 200
    assert "answer" in res_query.json()

def test_quick_demo_login(client):
    res = client.post("/api/seed/quick-demo-login")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "aarav.student@ledger.app"
