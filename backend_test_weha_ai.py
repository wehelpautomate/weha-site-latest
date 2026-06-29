#!/usr/bin/env python3
"""
Comprehensive test suite for WeHA AI chat endpoints + regression tests.
Tests the new OpenRouter-powered chat assistant endpoints in demo/placeholder mode.
"""

import requests
from datetime import datetime, timedelta

# Backend base URL from frontend/.env
BASE_URL = "https://git-live.preview.emergentagent.com/api"

def test_weha_ai_models():
    """Test 1: GET /api/weha-ai/models should return 5 models + default"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/weha-ai/models")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/weha-ai/models")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert "models" in data, "Response missing 'models' field"
    assert "default" in data, "Response missing 'default' field"
    
    models = data["models"]
    assert isinstance(models, list), "models should be a list"
    assert len(models) == 5, f"Expected 5 models, got {len(models)}"
    
    # Verify specific models are present
    assert "openai/gpt-4o-mini" in models, "Missing openai/gpt-4o-mini"
    assert "anthropic/claude-3.5-sonnet" in models, "Missing anthropic/claude-3.5-sonnet"
    
    # Verify default
    assert data["default"] == "openai/gpt-4o-mini", f"Expected default 'openai/gpt-4o-mini', got {data['default']}"
    
    print("✅ PASS: Models endpoint returns correct structure with 5 models and default")
    return True


def test_weha_ai_chat_valid():
    """Test 2: POST /api/weha-ai/chat with valid body should return mocked reply"""
    print("\n" + "="*80)
    print("TEST 2: POST /api/weha-ai/chat with valid body")
    print("="*80)
    
    payload = {
        "session_id": "test-sess-1",
        "messages": [
            {"role": "user", "content": "Which workflows should I automate first?"}
        ],
        "model": "openai/gpt-4o-mini"
    }
    
    response = requests.post(f"{BASE_URL}/weha-ai/chat", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert "reply" in data, "Response missing 'reply' field"
    assert "model" in data, "Response missing 'model' field"
    assert "mocked" in data, "Response missing 'mocked' field"
    
    # Verify reply is non-empty string
    assert isinstance(data["reply"], str), "reply should be a string"
    assert len(data["reply"]) > 0, "reply should not be empty"
    
    # Verify model
    assert data["model"] == "openai/gpt-4o-mini", f"Expected model 'openai/gpt-4o-mini', got {data['model']}"
    
    # Verify mocked is true (because OPENROUTER_API_KEY is blank)
    assert data["mocked"] is True, f"Expected mocked=true in demo mode, got {data['mocked']}"
    
    print("✅ PASS: Chat endpoint returns valid response with mocked=true in demo mode")
    return True


def test_weha_ai_chat_empty_messages():
    """Test 3: POST /api/weha-ai/chat with empty messages should return 422"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/weha-ai/chat with empty messages")
    print("="*80)
    
    payload = {
        "session_id": "x",
        "messages": []
    }
    
    response = requests.post(f"{BASE_URL}/weha-ai/chat", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    
    data = response.json()
    assert "detail" in data, "Error response should contain 'detail' field"
    
    print("✅ PASS: Empty messages correctly rejected with 422")
    return True


def test_weha_ai_chat_invalid_model():
    """Test 4: POST /api/weha-ai/chat with invalid model should fallback to default"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/weha-ai/chat with invalid/unknown model")
    print("="*80)
    
    payload = {
        "session_id": "test-sess-2",
        "messages": [
            {"role": "user", "content": "hi"}
        ],
        "model": "some/nonexistent-model"
    }
    
    response = requests.post(f"{BASE_URL}/weha-ai/chat", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert "model" in data, "Response missing 'model' field"
    
    # Should fallback to default model
    assert data["model"] == "openai/gpt-4o-mini", f"Expected fallback to 'openai/gpt-4o-mini', got {data['model']}"
    
    print("✅ PASS: Invalid model correctly falls back to default 'openai/gpt-4o-mini'")
    return True


def test_weha_ai_chat_multi_turn():
    """Test 5: POST /api/weha-ai/chat multi-turn conversation"""
    print("\n" + "="*80)
    print("TEST 5: POST /api/weha-ai/chat multi-turn conversation")
    print("="*80)
    
    session_id = "test-sess-multi-turn"
    
    # First turn
    payload1 = {
        "session_id": session_id,
        "messages": [
            {"role": "user", "content": "What is AI automation?"}
        ],
        "model": "openai/gpt-4o-mini"
    }
    
    response1 = requests.post(f"{BASE_URL}/weha-ai/chat", json=payload1)
    print(f"Turn 1 Status Code: {response1.status_code}")
    print(f"Turn 1 Response: {response1.json()}")
    
    assert response1.status_code == 200, f"Turn 1: Expected 200, got {response1.status_code}"
    data1 = response1.json()
    assert "reply" in data1 and len(data1["reply"]) > 0, "Turn 1: reply should be non-empty"
    
    # Second turn with history
    payload2 = {
        "session_id": session_id,
        "messages": [
            {"role": "user", "content": "What is AI automation?"},
            {"role": "assistant", "content": data1["reply"]},
            {"role": "user", "content": "Can you give me an example?"}
        ],
        "model": "openai/gpt-4o-mini"
    }
    
    response2 = requests.post(f"{BASE_URL}/weha-ai/chat", json=payload2)
    print(f"Turn 2 Status Code: {response2.status_code}")
    print(f"Turn 2 Response: {response2.json()}")
    
    assert response2.status_code == 200, f"Turn 2: Expected 200, got {response2.status_code}"
    data2 = response2.json()
    assert "reply" in data2 and len(data2["reply"]) > 0, "Turn 2: reply should be non-empty"
    
    print("✅ PASS: Multi-turn conversation works correctly")
    return True


def test_regression_root():
    """Test 6: REGRESSION - GET /api/ returns {message: 'WeHA API'}"""
    print("\n" + "="*80)
    print("TEST 6: REGRESSION - GET /api/")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert data.get("message") == "WeHA API", f"Expected message 'WeHA API', got {data.get('message')}"
    
    print("✅ PASS: Root endpoint still works")
    return True


def test_regression_audit_requests():
    """Test 7: REGRESSION - POST /api/audit-requests with valid payload"""
    print("\n" + "="*80)
    print("TEST 7: REGRESSION - POST /api/audit-requests")
    print("="*80)
    
    payload = {
        "name": "John Doe",
        "company": "Test Corp",
        "country": "UAE",
        "industry": "Technology",
        "process": "Lead generation automation",
        "contact_method": "Email",
        "email": "john@testcorp.com"
    }
    
    response = requests.post(f"{BASE_URL}/audit-requests", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert "id" in data, "Response missing 'id' field"
    assert data["name"] == payload["name"], "Name mismatch"
    assert data["process"] == payload["process"], "Process mismatch"
    
    print("✅ PASS: Audit requests endpoint still works")
    return True


def test_regression_availability():
    """Test 8: REGRESSION - GET /api/availability with valid date and timezone"""
    print("\n" + "="*80)
    print("TEST 8: REGRESSION - GET /api/availability")
    print("="*80)
    
    # Get next weekday (Monday-Friday)
    today = datetime.now()
    days_ahead = 1
    next_day = today + timedelta(days=days_ahead)
    
    # Find next weekday
    while next_day.weekday() >= 5:  # 5=Saturday, 6=Sunday
        days_ahead += 1
        next_day = today + timedelta(days=days_ahead)
    
    date_str = next_day.strftime("%Y-%m-%d")
    
    response = requests.get(f"{BASE_URL}/availability", params={
        "date": date_str,
        "tz": "Asia/Dubai"
    })
    print(f"Status Code: {response.status_code}")
    print(f"Date: {date_str}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert isinstance(data, list), "Response should be a list of slots"
    
    if len(data) > 0:
        # Verify slot structure
        slot = data[0]
        assert "label" in slot, "Slot missing 'label' field"
        assert "iso_utc" in slot, "Slot missing 'iso_utc' field"
        assert "taken" in slot, "Slot missing 'taken' field"
    
    print(f"✅ PASS: Availability endpoint still works, returned {len(data)} slots")
    return True


def test_regression_playbook_requests():
    """Test 9: REGRESSION - POST /api/playbook-requests with valid payload"""
    print("\n" + "="*80)
    print("TEST 9: REGRESSION - POST /api/playbook-requests")
    print("="*80)
    
    payload = {
        "name": "Jane Smith",
        "company": "Innovation Ltd",
        "email": "jane@innovation.com"
    }
    
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    data = response.json()
    assert "id" in data, "Response missing 'id' field"
    assert data["name"] == payload["name"], "Name mismatch"
    assert data["email"] == payload["email"], "Email mismatch"
    
    print("✅ PASS: Playbook requests endpoint still works")
    return True


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("WEHA AI CHAT ENDPOINTS + REGRESSION TEST SUITE")
    print("="*80)
    print(f"Backend URL: {BASE_URL}")
    print("="*80)
    
    tests = [
        ("GET /api/weha-ai/models", test_weha_ai_models),
        ("POST /api/weha-ai/chat (valid)", test_weha_ai_chat_valid),
        ("POST /api/weha-ai/chat (empty messages)", test_weha_ai_chat_empty_messages),
        ("POST /api/weha-ai/chat (invalid model)", test_weha_ai_chat_invalid_model),
        ("POST /api/weha-ai/chat (multi-turn)", test_weha_ai_chat_multi_turn),
        ("REGRESSION: GET /api/", test_regression_root),
        ("REGRESSION: POST /api/audit-requests", test_regression_audit_requests),
        ("REGRESSION: GET /api/availability", test_regression_availability),
        ("REGRESSION: POST /api/playbook-requests", test_regression_playbook_requests),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"❌ FAIL: {test_name}")
            print(f"   Error: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {test_name}")
            print(f"   Exception: {e}")
            failed += 1
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print("="*80)
    
    if failed == 0:
        print("✅ ALL TESTS PASSED")
    else:
        print(f"❌ {failed} TEST(S) FAILED")
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
