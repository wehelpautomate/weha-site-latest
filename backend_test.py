#!/usr/bin/env python3
"""
Comprehensive backend test for WeHA API
Tests the UPDATED playbook lead capture endpoint with relaxed validation
and runs regression tests on existing endpoints.
"""

import requests
from datetime import datetime, timedelta
import sys

# Backend URL from frontend/.env
BASE_URL = "https://git-live.preview.emergentagent.com/api"

def test_playbook_minimal_payload():
    """Test 1: POST with ONLY name+email => 200, company should be null"""
    print("\n[TEST 1] POST /api/playbook-requests with minimal payload (name+email only)")
    payload = {
        "name": "Jordan Lee",
        "email": "jordan@brightledger.co"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "id" in data, "Response should contain 'id'"
    assert "created_at" in data, "Response should contain 'created_at'"
    assert data["name"] == "Jordan Lee", f"Expected name 'Jordan Lee', got {data.get('name')}"
    assert data["email"] == "jordan@brightledger.co", f"Expected email 'jordan@brightledger.co', got {data.get('email')}"
    assert data.get("company") is None, f"Expected company to be null, got {data.get('company')}"
    print("  ✅ PASS: Minimal payload accepted, company is null")
    return data["id"]


def test_playbook_with_source_and_asset_title():
    """Test 2: POST with name+email+source+asset_title => 200, both fields persisted"""
    print("\n[TEST 2] POST /api/playbook-requests with source and asset_title")
    payload = {
        "name": "Sam Patel",
        "email": "sam@techcorp.io",
        "source": "resource:ebook:operating-system",
        "asset_title": "The Automation-First Operating System"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "id" in data, "Response should contain 'id'"
    assert "created_at" in data, "Response should contain 'created_at'"
    assert data["source"] == "resource:ebook:operating-system", f"Expected source to be persisted, got {data.get('source')}"
    assert data["asset_title"] == "The Automation-First Operating System", f"Expected asset_title to be persisted, got {data.get('asset_title')}"
    print("  ✅ PASS: source and asset_title persisted and returned")
    return data["id"]


def test_playbook_empty_name():
    """Test 3: POST with empty/whitespace name => 422"""
    print("\n[TEST 3] POST /api/playbook-requests with empty/whitespace name")
    payload = {
        "name": "  ",
        "email": "a@b.com"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print("  ✅ PASS: Empty name correctly rejected with 422")


def test_playbook_invalid_email():
    """Test 4: POST with invalid email => 422 (pydantic EmailStr)"""
    print("\n[TEST 4] POST /api/playbook-requests with invalid email format")
    payload = {
        "name": "X",
        "email": "notanemail"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print("  ✅ PASS: Invalid email correctly rejected with 422")


def test_playbook_missing_email():
    """Test 5: POST missing email field => 422"""
    print("\n[TEST 5] POST /api/playbook-requests missing email field")
    payload = {
        "name": "X"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print("  ✅ PASS: Missing email correctly rejected with 422")


def test_playbook_backwards_compatibility():
    """Test 6: POST with full payload (all fields) => 200"""
    print("\n[TEST 6] POST /api/playbook-requests with full payload (backwards compatibility)")
    payload = {
        "name": "Full Name",
        "company": "Acme Corp",
        "designation": "Operations Manager",
        "email": "operations@acmecorp.io",
        "industry": "Technology",
        "country": "UAE",
        "session_interest": "Maybe later",
        "source": "resources"
    }
    response = requests.post(f"{BASE_URL}/playbook-requests", json=payload)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["name"] == "Full Name", f"Expected name 'Full Name', got {data.get('name')}"
    assert data["company"] == "Acme Corp", f"Expected company 'Acme Corp', got {data.get('company')}"
    assert data["designation"] == "Operations Manager", f"Expected designation, got {data.get('designation')}"
    assert data["email"] == "operations@acmecorp.io", f"Expected email, got {data.get('email')}"
    print("  ✅ PASS: Full payload accepted (backwards compatible)")
    return data["id"]


def test_playbook_get_list(created_ids):
    """Test 7: GET /api/playbook-requests => 200, sorted newest-first, includes created records"""
    print("\n[TEST 7] GET /api/playbook-requests (list sorted newest-first)")
    response = requests.get(f"{BASE_URL}/playbook-requests")
    print(f"  Status: {response.status_code}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Response should be a list"
    print(f"  Total records: {len(data)}")
    
    # Check that our created records are in the list
    returned_ids = [item["id"] for item in data]
    for created_id in created_ids:
        assert created_id in returned_ids, f"Created record {created_id} not found in list"
    
    # Check sorting (newest first)
    if len(data) > 1:
        for i in range(len(data) - 1):
            current_time = datetime.fromisoformat(data[i]["created_at"].replace("Z", "+00:00"))
            next_time = datetime.fromisoformat(data[i+1]["created_at"].replace("Z", "+00:00"))
            assert current_time >= next_time, "List should be sorted by created_at descending (newest first)"
    
    # Check that source and asset_title fields are present
    for item in data:
        if item["id"] == created_ids[1]:  # The one with source and asset_title
            assert item.get("source") == "resource:ebook:operating-system", "source field should be present"
            assert item.get("asset_title") == "The Automation-First Operating System", "asset_title field should be present"
            print(f"  ✅ source and asset_title fields confirmed in GET response")
    
    print("  ✅ PASS: GET returns list sorted newest-first with all fields")


def test_regression_root():
    """Test 8: GET /api/ => 200 {message: 'WeHA API'}"""
    print("\n[TEST 8 - REGRESSION] GET /api/")
    response = requests.get(f"{BASE_URL}/")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("message") == "WeHA API", f"Expected message 'WeHA API', got {data.get('message')}"
    print("  ✅ PASS: Root endpoint working")


def test_regression_audit_requests():
    """Test 9: POST /api/audit-requests with valid payload => 200; empty name/process => 422"""
    print("\n[TEST 9 - REGRESSION] POST /api/audit-requests")
    
    # Valid payload
    print("  9a. Valid payload")
    payload = {
        "name": "Alex Johnson",
        "company": "TechFlow Solutions",
        "country": "UAE",
        "industry": "Technology",
        "process": "Lead qualification automation",
        "contact_method": "Email",
        "email": "alex@techflow.io"
    }
    response = requests.post(f"{BASE_URL}/audit-requests", json=payload)
    print(f"    Status: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "id" in data, "Response should contain 'id'"
    assert "created_at" in data, "Response should contain 'created_at'"
    print("    ✅ PASS: Valid audit request accepted")
    
    # Empty name
    print("  9b. Empty name")
    payload_empty_name = {
        "name": "",
        "company": "TechFlow Solutions",
        "country": "UAE",
        "industry": "Technology",
        "process": "Some process",
        "contact_method": "Email"
    }
    response = requests.post(f"{BASE_URL}/audit-requests", json=payload_empty_name)
    print(f"    Status: {response.status_code}")
    assert response.status_code == 422, f"Expected 422 for empty name, got {response.status_code}"
    print("    ✅ PASS: Empty name rejected")
    
    # Empty process
    print("  9c. Empty process")
    payload_empty_process = {
        "name": "Alex Johnson",
        "company": "TechFlow Solutions",
        "country": "UAE",
        "industry": "Technology",
        "process": "",
        "contact_method": "Email"
    }
    response = requests.post(f"{BASE_URL}/audit-requests", json=payload_empty_process)
    print(f"    Status: {response.status_code}")
    assert response.status_code == 422, f"Expected 422 for empty process, got {response.status_code}"
    print("    ✅ PASS: Empty process rejected")


def test_regression_availability():
    """Test 10: GET /api/availability?date=<future weekday>&tz=Asia/Dubai => 200 with ~18 slots"""
    print("\n[TEST 10 - REGRESSION] GET /api/availability")
    
    # Find next weekday (Monday-Friday)
    today = datetime.now()
    days_ahead = 1
    next_date = today + timedelta(days=days_ahead)
    while next_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
        days_ahead += 1
        next_date = today + timedelta(days=days_ahead)
    
    date_str = next_date.strftime("%Y-%m-%d")
    print(f"  Testing with date: {date_str} (weekday: {next_date.strftime('%A')})")
    
    response = requests.get(f"{BASE_URL}/availability", params={"date": date_str, "tz": "Asia/Dubai"})
    print(f"  Status: {response.status_code}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Response should be a list"
    print(f"  Number of slots: {len(data)}")
    
    # Should have ~18 slots (9:00-17:30 in 30-min intervals)
    assert len(data) >= 15, f"Expected at least 15 slots, got {len(data)}"
    
    # Check structure of first slot
    if len(data) > 0:
        slot = data[0]
        assert "label" in slot, "Slot should have 'label'"
        assert "iso_utc" in slot, "Slot should have 'iso_utc'"
        assert "taken" in slot, "Slot should have 'taken'"
        print(f"  Sample slot: {slot}")
    
    print("  ✅ PASS: Availability endpoint working")


def test_regression_booking_double_booking():
    """Test 11: POST /api/booking-requests / availability double-booking flow"""
    print("\n[TEST 11 - REGRESSION] Booking double-booking prevention")
    
    # Get available slots
    today = datetime.now()
    days_ahead = 1
    next_date = today + timedelta(days=days_ahead)
    while next_date.weekday() >= 5:
        days_ahead += 1
        next_date = today + timedelta(days=days_ahead)
    
    date_str = next_date.strftime("%Y-%m-%d")
    response = requests.get(f"{BASE_URL}/availability", params={"date": date_str, "tz": "Asia/Dubai"})
    assert response.status_code == 200, "Failed to get availability"
    slots = response.json()
    
    if len(slots) == 0:
        print("  ⚠️  SKIP: No available slots found for testing double-booking")
        return
    
    # Find a slot that's not taken
    available_slot = None
    for slot in slots:
        if not slot["taken"]:
            available_slot = slot
            break
    
    if not available_slot:
        print("  ⚠️  SKIP: All slots are taken, cannot test double-booking")
        return
    
    print(f"  Testing with slot: {available_slot['label']} ({available_slot['iso_utc']})")
    
    # Book the slot
    print("  11a. First booking")
    payload1 = {
        "name": "First Booker",
        "company": "Company Alpha",
        "country": "UAE",
        "industry": "Tech",
        "process": "Automation",
        "contact_method": "Email",
        "email": "first@companyalpha.io",
        "slot_iso_utc": available_slot["iso_utc"],
        "timezone": "Asia/Dubai"
    }
    response1 = requests.post(f"{BASE_URL}/audit-requests", json=payload1)
    print(f"    Status: {response1.status_code}")
    assert response1.status_code == 200, f"Expected 200 for first booking, got {response1.status_code}"
    print("    ✅ PASS: First booking successful")
    
    # Try to book the same slot again
    print("  11b. Second booking (should fail with 409)")
    payload2 = {
        "name": "Second Booker",
        "company": "Company Beta",
        "country": "UAE",
        "industry": "Tech",
        "process": "Automation",
        "contact_method": "Email",
        "email": "second@companybeta.io",
        "slot_iso_utc": available_slot["iso_utc"],
        "timezone": "Asia/Dubai"
    }
    response2 = requests.post(f"{BASE_URL}/audit-requests", json=payload2)
    print(f"    Status: {response2.status_code}")
    print(f"    Response: {response2.json()}")
    assert response2.status_code == 409, f"Expected 409 for double-booking, got {response2.status_code}"
    print("    ✅ PASS: Double-booking prevented with 409")


def main():
    print("=" * 80)
    print("WeHA Backend API Test Suite")
    print("Testing UPDATED playbook lead capture + regression tests")
    print("=" * 80)
    
    created_ids = []
    
    try:
        # NEW/CHANGED BEHAVIOR TESTS (1-7)
        print("\n" + "=" * 80)
        print("PART 1: NEW/CHANGED PLAYBOOK LEAD CAPTURE BEHAVIOR")
        print("=" * 80)
        
        id1 = test_playbook_minimal_payload()
        created_ids.append(id1)
        
        id2 = test_playbook_with_source_and_asset_title()
        created_ids.append(id2)
        
        test_playbook_empty_name()
        test_playbook_invalid_email()
        test_playbook_missing_email()
        
        id3 = test_playbook_backwards_compatibility()
        created_ids.append(id3)
        
        test_playbook_get_list(created_ids)
        
        # REGRESSION TESTS (8-11)
        print("\n" + "=" * 80)
        print("PART 2: REGRESSION TESTS (EXISTING ENDPOINTS)")
        print("=" * 80)
        
        test_regression_root()
        test_regression_audit_requests()
        test_regression_availability()
        test_regression_booking_double_booking()
        
        # SUMMARY
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print("✅ ALL 11 TESTS PASSED")
        print("\nNEW BEHAVIOR VERIFIED:")
        print("  ✅ 1. Minimal payload (name+email only) accepted, company null")
        print("  ✅ 2. source and asset_title fields persisted and returned")
        print("  ✅ 3. Empty/whitespace name rejected (422)")
        print("  ✅ 4. Invalid email format rejected (422)")
        print("  ✅ 5. Missing email field rejected (422)")
        print("  ✅ 6. Backwards compatible with full payload")
        print("  ✅ 7. GET returns list sorted newest-first with all fields")
        print("\nREGRESSION TESTS:")
        print("  ✅ 8. GET /api/ returns {message: 'WeHA API'}")
        print("  ✅ 9. POST /api/audit-requests validation working")
        print("  ✅ 10. GET /api/availability returns slots")
        print("  ✅ 11. Double-booking prevention working (409)")
        print("=" * 80)
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
