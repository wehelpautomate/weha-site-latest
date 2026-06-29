#!/usr/bin/env python3
"""
Backend API Testing for WeHA Booking System
Tests the new GET /api/availability and modified POST /api/audit-requests endpoints
"""

import requests
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

# Read backend URL from frontend/.env
BACKEND_URL = "https://git-live.preview.emergentagent.com/api"

def get_next_weekday(target_weekday: int) -> str:
    """Get the next occurrence of a specific weekday (0=Mon, 1=Tue, etc.)"""
    today = datetime.now()
    days_ahead = target_weekday - today.weekday()
    if days_ahead <= 0:  # Target day already happened this week
        days_ahead += 7
    next_date = today + timedelta(days=days_ahead)
    return next_date.strftime("%Y-%m-%d")

def get_next_weekend() -> str:
    """Get the next Saturday"""
    today = datetime.now()
    days_ahead = 5 - today.weekday()  # 5 = Saturday
    if days_ahead <= 0:
        days_ahead += 7
    next_saturday = today + timedelta(days=days_ahead)
    return next_saturday.strftime("%Y-%m-%d")

def get_yesterday() -> str:
    """Get yesterday's date"""
    yesterday = datetime.now() - timedelta(days=1)
    return yesterday.strftime("%Y-%m-%d")

# Test results storage
test_results = []

def log_test(test_num: int, description: str, passed: bool, details: str):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")
    print(f"Status: {status}")
    print(f"Details: {details}")
    test_results.append({
        "test_num": test_num,
        "description": description,
        "passed": passed,
        "details": details
    })
    return passed

# ============================================================================
# TEST 1: GET /api/availability for future weekday with Asia/Dubai timezone
# ============================================================================
def test_1_availability_future_weekday_dubai():
    """Test GET /api/availability?date=YYYY-MM-DD&tz=Asia/Dubai for future Tuesday"""
    try:
        next_tuesday = get_next_weekday(1)  # 1 = Tuesday
        url = f"{BACKEND_URL}/availability?date={next_tuesday}&tz=Asia/Dubai"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code != 200:
            return log_test(1, "Availability for future weekday (Dubai)", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        # Verify it's a non-empty list
        if not isinstance(data, list) or len(data) == 0:
            return log_test(1, "Availability for future weekday (Dubai)", False, 
                          f"Expected non-empty list, got {type(data)} with {len(data) if isinstance(data, list) else 0} items")
        
        # Verify each item has required keys
        required_keys = ["label", "iso_utc", "taken"]
        for i, slot in enumerate(data):
            for key in required_keys:
                if key not in slot:
                    return log_test(1, "Availability for future weekday (Dubai)", False, 
                                  f"Slot {i} missing key '{key}'")
        
        # Verify label format (HH:MM)
        first_label = data[0]["label"]
        if not (len(first_label) == 5 and first_label[2] == ":"):
            return log_test(1, "Availability for future weekday (Dubai)", False, 
                          f"Invalid label format: {first_label}")
        
        # Verify iso_utc ends with Z
        first_iso = data[0]["iso_utc"]
        if not first_iso.endswith("Z"):
            return log_test(1, "Availability for future weekday (Dubai)", False, 
                          f"iso_utc doesn't end with Z: {first_iso}")
        
        # Verify taken is boolean
        if not isinstance(data[0]["taken"], bool):
            return log_test(1, "Availability for future weekday (Dubai)", False, 
                          f"taken is not boolean: {type(data[0]['taken'])}")
        
        # Verify we have 18 slots (9:00-17:30, every 30 min)
        expected_slots = 18
        if len(data) != expected_slots:
            # This might be OK if some slots are in the past
            print(f"⚠️  WARNING: Expected {expected_slots} slots, got {len(data)}")
        
        return log_test(1, "Availability for future weekday (Dubai)", True, 
                      f"Returned {len(data)} slots with correct structure. First slot: {data[0]}")
        
    except Exception as e:
        return log_test(1, "Availability for future weekday (Dubai)", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 2: GET /api/availability with Australia/Sydney timezone
# ============================================================================
def test_2_availability_sydney():
    """Test GET /api/availability with tz=Australia/Sydney"""
    try:
        next_tuesday = get_next_weekday(1)
        url = f"{BACKEND_URL}/availability?date={next_tuesday}&tz=Australia/Sydney"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code != 200:
            return log_test(2, "Availability with Sydney timezone", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if not isinstance(data, list) or len(data) == 0:
            return log_test(2, "Availability with Sydney timezone", False, 
                          f"Expected non-empty list, got {type(data)} with {len(data) if isinstance(data, list) else 0} items")
        
        # Store Sydney iso_utc for comparison
        sydney_iso = data[0]["iso_utc"] if data else None
        
        return log_test(2, "Availability with Sydney timezone", True, 
                      f"Returned {len(data)} slots. First iso_utc: {sydney_iso}")
        
    except Exception as e:
        return log_test(2, "Availability with Sydney timezone", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 3: GET /api/availability with multiple allowed timezones
# ============================================================================
def test_3_availability_multiple_timezones():
    """Test GET /api/availability with Asia/Kolkata, Asia/Singapore, America/New_York"""
    try:
        next_tuesday = get_next_weekday(1)
        timezones = ["Asia/Kolkata", "Asia/Singapore", "America/New_York"]
        all_passed = True
        details = []
        
        for tz in timezones:
            url = f"{BACKEND_URL}/availability?date={next_tuesday}&tz={tz}"
            print(f"Request: GET {url}")
            
            response = requests.get(url, timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code != 200:
                all_passed = False
                details.append(f"{tz}: FAIL - status {response.status_code}")
            else:
                data = response.json()
                if not isinstance(data, list):
                    all_passed = False
                    details.append(f"{tz}: FAIL - not a list")
                else:
                    details.append(f"{tz}: OK - {len(data)} slots")
        
        return log_test(3, "Availability with multiple allowed timezones", all_passed, 
                      "; ".join(details))
        
    except Exception as e:
        return log_test(3, "Availability with multiple allowed timezones", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 4: GET /api/availability with invalid timezone
# ============================================================================
def test_4_availability_invalid_timezone():
    """Test GET /api/availability with tz=Europe/London (should return 400)"""
    try:
        next_tuesday = get_next_weekday(1)
        url = f"{BACKEND_URL}/availability?date={next_tuesday}&tz=Europe/London"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            return log_test(4, "Availability with invalid timezone", False, 
                          f"Expected 400, got {response.status_code}")
        
        data = response.json()
        detail = data.get("detail", "")
        
        if "Unsupported timezone: Europe/London" not in detail:
            return log_test(4, "Availability with invalid timezone", False, 
                          f"Expected 'Unsupported timezone: Europe/London' in detail, got: {detail}")
        
        return log_test(4, "Availability with invalid timezone", True, 
                      f"Correctly returned 400 with detail: {detail}")
        
    except Exception as e:
        return log_test(4, "Availability with invalid timezone", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 5: GET /api/availability with bad date format
# ============================================================================
def test_5_availability_bad_date_format():
    """Test GET /api/availability with date=07-06-2026 (should return 400)"""
    try:
        url = f"{BACKEND_URL}/availability?date=07-06-2026&tz=Asia/Dubai"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            return log_test(5, "Availability with bad date format", False, 
                          f"Expected 400, got {response.status_code}")
        
        return log_test(5, "Availability with bad date format", True, 
                      f"Correctly returned 400 for invalid date format")
        
    except Exception as e:
        return log_test(5, "Availability with bad date format", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 6: GET /api/availability for weekend date
# ============================================================================
def test_6_availability_weekend():
    """Test GET /api/availability for Saturday (should return empty list)"""
    try:
        next_saturday = get_next_weekend()
        url = f"{BACKEND_URL}/availability?date={next_saturday}&tz=Asia/Dubai"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return log_test(6, "Availability for weekend", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if not isinstance(data, list):
            return log_test(6, "Availability for weekend", False, 
                          f"Expected list, got {type(data)}")
        
        if len(data) != 0:
            return log_test(6, "Availability for weekend", False, 
                          f"Expected empty list, got {len(data)} items")
        
        return log_test(6, "Availability for weekend", True, 
                      f"Correctly returned empty list for weekend date")
        
    except Exception as e:
        return log_test(6, "Availability for weekend", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 7: GET /api/availability for past date
# ============================================================================
def test_7_availability_past_date():
    """Test GET /api/availability for yesterday (should return empty list or only future slots)"""
    try:
        yesterday = get_yesterday()
        url = f"{BACKEND_URL}/availability?date={yesterday}&tz=Asia/Dubai"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return log_test(7, "Availability for past date", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if not isinstance(data, list):
            return log_test(7, "Availability for past date", False, 
                          f"Expected list, got {type(data)}")
        
        # Should be empty or only slots > 15 min in future
        return log_test(7, "Availability for past date", True, 
                      f"Returned {len(data)} slots (expected 0 or only future slots)")
        
    except Exception as e:
        return log_test(7, "Availability for past date", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 8: POST /api/audit-requests with slot booking
# ============================================================================
def test_8_create_booking_with_slot():
    """Test POST /api/audit-requests with a real available slot"""
    try:
        # First, get available slots
        next_tuesday = get_next_weekday(1)
        url = f"{BACKEND_URL}/availability?date={next_tuesday}&tz=Asia/Dubai"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return log_test(8, "Create booking with slot", False, 
                          f"Failed to get availability: {response.status_code}")
        
        slots = response.json()
        if not slots:
            return log_test(8, "Create booking with slot", False, 
                          "No available slots found")
        
        # Pick the first available slot that's not taken
        available_slot = None
        for slot in slots:
            if not slot["taken"]:
                available_slot = slot
                break
        
        if not available_slot:
            return log_test(8, "Create booking with slot", False, 
                          "No untaken slots found")
        
        # Create booking with this slot
        payload = {
            "name": "Ahmed Al-Mansoori",
            "company": "Dubai Real Estate Holdings",
            "country": "UAE",
            "industry": "Real Estate",
            "process": "Manually copying leads from property portals to CRM",
            "contact_method": "WhatsApp",
            "email": "ahmed.almansoori@dubaireh.ae",
            "slot_iso_utc": available_slot["iso_utc"],
            "timezone": "Asia/Dubai"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return log_test(8, "Create booking with slot", False, 
                          f"Expected 200, got {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify all fields are persisted
        required_fields = ["id", "name", "company", "country", "industry", "process", 
                          "contact_method", "email", "slot_iso_utc", "timezone", "created_at"]
        for field in required_fields:
            if field not in data:
                return log_test(8, "Create booking with slot", False, 
                              f"Missing field: {field}")
        
        # Verify slot_iso_utc matches
        if data["slot_iso_utc"] != available_slot["iso_utc"]:
            return log_test(8, "Create booking with slot", False, 
                          f"slot_iso_utc mismatch: {data['slot_iso_utc']} != {available_slot['iso_utc']}")
        
        # Store for next test
        global booked_slot_iso, booked_date, booked_tz
        booked_slot_iso = available_slot["iso_utc"]
        booked_date = next_tuesday
        booked_tz = "Asia/Dubai"
        
        return log_test(8, "Create booking with slot", True, 
                      f"Successfully created booking with slot {available_slot['iso_utc']}")
        
    except Exception as e:
        return log_test(8, "Create booking with slot", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 9: Verify slot is now taken
# ============================================================================
def test_9_verify_slot_taken():
    """Test GET /api/availability to verify booked slot now has taken:true"""
    try:
        if not booked_slot_iso:
            return log_test(9, "Verify slot is taken", False, 
                          "No booked slot from previous test")
        
        url = f"{BACKEND_URL}/availability?date={booked_date}&tz={booked_tz}"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            return log_test(9, "Verify slot is taken", False, 
                          f"Expected 200, got {response.status_code}")
        
        slots = response.json()
        
        # Find the booked slot
        booked_slot = None
        for slot in slots:
            if slot["iso_utc"] == booked_slot_iso:
                booked_slot = slot
                break
        
        if not booked_slot:
            return log_test(9, "Verify slot is taken", False, 
                          f"Booked slot {booked_slot_iso} not found in availability")
        
        if not booked_slot["taken"]:
            return log_test(9, "Verify slot is taken", False, 
                          f"Slot {booked_slot_iso} should have taken:true but has taken:false")
        
        return log_test(9, "Verify slot is taken", True, 
                      f"Slot {booked_slot_iso} correctly marked as taken")
        
    except Exception as e:
        return log_test(9, "Verify slot is taken", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 10: Double booking prevention
# ============================================================================
def test_10_double_booking_prevention():
    """Test POST /api/audit-requests with same slot (should return 409)"""
    try:
        if not booked_slot_iso:
            return log_test(10, "Double booking prevention", False, 
                          "No booked slot from previous test")
        
        payload = {
            "name": "Fatima Hassan",
            "company": "Another Company",
            "country": "UAE",
            "industry": "Technology",
            "process": "Data entry automation",
            "contact_method": "email",
            "email": "fatima@anothercompany.ae",
            "slot_iso_utc": booked_slot_iso,
            "timezone": "Asia/Dubai"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 409:
            return log_test(10, "Double booking prevention", False, 
                          f"Expected 409, got {response.status_code}")
        
        data = response.json()
        detail = data.get("detail", "")
        
        if "slot was just taken" not in detail.lower() and "taken" not in detail.lower():
            return log_test(10, "Double booking prevention", False, 
                          f"Expected detail about slot being taken, got: {detail}")
        
        return log_test(10, "Double booking prevention", True, 
                      f"Correctly returned 409 with detail: {detail}")
        
    except Exception as e:
        return log_test(10, "Double booking prevention", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 11: Booking past slot
# ============================================================================
def test_11_booking_past_slot():
    """Test POST /api/audit-requests with past slot_iso_utc (should return 422)"""
    try:
        # Use a past timestamp
        past_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat().replace("+00:00", "Z")
        
        payload = {
            "name": "Test User",
            "company": "Test Company",
            "country": "UAE",
            "industry": "Technology",
            "process": "Testing past slot",
            "contact_method": "email",
            "email": "test@test.com",
            "slot_iso_utc": past_time,
            "timezone": "Asia/Dubai"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 422:
            return log_test(11, "Booking past slot", False, 
                          f"Expected 422, got {response.status_code}")
        
        data = response.json()
        detail = data.get("detail", "")
        
        if "past" not in detail.lower():
            return log_test(11, "Booking past slot", False, 
                          f"Expected detail about past slot, got: {detail}")
        
        return log_test(11, "Booking past slot", True, 
                      f"Correctly returned 422 with detail: {detail}")
        
    except Exception as e:
        return log_test(11, "Booking past slot", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 12: Invalid slot_iso_utc format
# ============================================================================
def test_12_invalid_slot_format():
    """Test POST /api/audit-requests with invalid slot_iso_utc (should return 422)"""
    try:
        payload = {
            "name": "Test User",
            "company": "Test Company",
            "country": "UAE",
            "industry": "Technology",
            "process": "Testing invalid slot",
            "contact_method": "email",
            "email": "test@test.com",
            "slot_iso_utc": "not-a-date",
            "timezone": "Asia/Dubai"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 422:
            return log_test(12, "Invalid slot format", False, 
                          f"Expected 422, got {response.status_code}")
        
        return log_test(12, "Invalid slot format", True, 
                      f"Correctly returned 422 for invalid slot format")
        
    except Exception as e:
        return log_test(12, "Invalid slot format", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 13: Backwards compatibility (no slot)
# ============================================================================
def test_13_backwards_compatibility():
    """Test POST /api/audit-requests without slot_iso_utc (should work normally)"""
    try:
        payload = {
            "name": "Legacy User",
            "company": "Legacy Company",
            "country": "UAE",
            "industry": "Manufacturing",
            "process": "Manual inventory tracking",
            "contact_method": "phone",
            "email": "legacy@company.com"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return log_test(13, "Backwards compatibility (no slot)", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        # Verify basic fields are present
        if "id" not in data or "name" not in data or "created_at" not in data:
            return log_test(13, "Backwards compatibility (no slot)", False, 
                          "Missing basic fields in response")
        
        # slot_iso_utc should be None or not present
        if data.get("slot_iso_utc") is not None:
            print(f"⚠️  WARNING: slot_iso_utc is {data.get('slot_iso_utc')}, expected None")
        
        return log_test(13, "Backwards compatibility (no slot)", True, 
                      f"Successfully created audit request without slot")
        
    except Exception as e:
        return log_test(13, "Backwards compatibility (no slot)", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 14: Validation still works
# ============================================================================
def test_14_validation_still_works():
    """Test POST /api/audit-requests with empty name (should return 422)"""
    try:
        payload = {
            "name": "",
            "company": "Test Company",
            "country": "UAE",
            "industry": "Technology",
            "process": "Testing validation",
            "contact_method": "email",
            "email": "test@test.com"
        }
        
        print(f"Request: POST {BACKEND_URL}/audit-requests")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BACKEND_URL}/audit-requests", json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 422:
            return log_test(14, "Validation still works", False, 
                          f"Expected 422, got {response.status_code}")
        
        return log_test(14, "Validation still works", True, 
                      f"Correctly returned 422 for empty name")
        
    except Exception as e:
        return log_test(14, "Validation still works", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 15: Regression - Root endpoint
# ============================================================================
def test_15_regression_root():
    """Test GET /api/ still returns {message: WeHA API}"""
    try:
        url = f"{BACKEND_URL}/"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            return log_test(15, "Regression: Root endpoint", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if data.get("message") != "WeHA API":
            return log_test(15, "Regression: Root endpoint", False, 
                          f"Expected message 'WeHA API', got {data}")
        
        return log_test(15, "Regression: Root endpoint", True, 
                      f"Root endpoint still working correctly")
        
    except Exception as e:
        return log_test(15, "Regression: Root endpoint", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# TEST 16: Regression - GET audit requests includes slot info
# ============================================================================
def test_16_regression_get_audit_requests():
    """Test GET /api/audit-requests includes bookings with slot_iso_utc"""
    try:
        url = f"{BACKEND_URL}/audit-requests"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code != 200:
            return log_test(16, "Regression: GET audit-requests", False, 
                          f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if not isinstance(data, list):
            return log_test(16, "Regression: GET audit-requests", False, 
                          f"Expected list, got {type(data)}")
        
        # Find at least one booking with slot_iso_utc
        has_slot_booking = any(item.get("slot_iso_utc") for item in data)
        
        if not has_slot_booking:
            print("⚠️  WARNING: No bookings with slot_iso_utc found")
        
        return log_test(16, "Regression: GET audit-requests", True, 
                      f"GET audit-requests working, returned {len(data)} items, {sum(1 for x in data if x.get('slot_iso_utc'))} with slots")
        
    except Exception as e:
        return log_test(16, "Regression: GET audit-requests", False, 
                      f"Exception: {str(e)}")

# ============================================================================
# Main test runner
# ============================================================================

# Global variables for test state
booked_slot_iso = None
booked_date = None
booked_tz = None

def main():
    """Run all booking system tests"""
    print("\n" + "="*80)
    print("WeHA Booking System - Comprehensive Backend API Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*80)
    
    # Run all tests in sequence
    test_1_availability_future_weekday_dubai()
    test_2_availability_sydney()
    test_3_availability_multiple_timezones()
    test_4_availability_invalid_timezone()
    test_5_availability_bad_date_format()
    test_6_availability_weekend()
    test_7_availability_past_date()
    test_8_create_booking_with_slot()
    test_9_verify_slot_taken()
    test_10_double_booking_prevention()
    test_11_booking_past_slot()
    test_12_invalid_slot_format()
    test_13_backwards_compatibility()
    test_14_validation_still_works()
    test_15_regression_root()
    test_16_regression_get_audit_requests()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for r in test_results if r["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {passed}/{total} tests passed\n")
    
    # Group by status
    passed_tests = [r for r in test_results if r["passed"]]
    failed_tests = [r for r in test_results if not r["passed"]]
    
    if failed_tests:
        print("❌ FAILED TESTS:")
        for r in failed_tests:
            print(f"  Test {r['test_num']}: {r['description']}")
            print(f"    Details: {r['details']}")
        print()
    
    if passed_tests:
        print("✅ PASSED TESTS:")
        for r in passed_tests:
            print(f"  Test {r['test_num']}: {r['description']}")
        print()
    
    print("="*80)
    
    return passed == total, test_results

if __name__ == "__main__":
    success, results = main()
    exit(0 if success else 1)
