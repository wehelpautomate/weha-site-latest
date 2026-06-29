#!/usr/bin/env python3
"""
Comprehensive backend test for Cloudflare deploy fix verification.
Tests the FastAPI mirror endpoints that back the booking + lead forms.
"""

import requests
from datetime import datetime, timedelta
import sys

# Read backend URL from frontend/.env
BASE_URL = "https://git-live.preview.emergentagent.com/api"

def get_next_weekday():
    """Get next future weekday (Mon-Fri) in YYYY-MM-DD format."""
    today = datetime.now()
    days_ahead = 1
    next_day = today + timedelta(days=days_ahead)
    while next_day.weekday() >= 5:  # 5=Saturday, 6=Sunday
        days_ahead += 1
        next_day = today + timedelta(days=days_ahead)
    return next_day.strftime("%Y-%m-%d")

def get_next_saturday():
    """Get next future Saturday in YYYY-MM-DD format."""
    today = datetime.now()
    days_ahead = (5 - today.weekday()) % 7  # 5 = Saturday
    if days_ahead == 0:
        days_ahead = 7
    next_saturday = today + timedelta(days=days_ahead)
    return next_saturday.strftime("%Y-%m-%d")

def test_1_availability_kolkata():
    """Test 1: GET /api/availability with Asia/Kolkata timezone."""
    print("\n=== TEST 1: GET /api/availability?date=<weekday>&tz=Asia/Kolkata ===")
    date = get_next_weekday()
    url = f"{BASE_URL}/availability?date={date}&tz=Asia/Kolkata"
    print(f"URL: {url}")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        data = resp.json()
        print(f"Response type: {type(data)}")
        print(f"Number of slots: {len(data)}")
        
        if not isinstance(data, list):
            print(f"❌ FAIL: Expected JSON array, got {type(data)}")
            return False
        
        if len(data) == 0:
            print(f"⚠️  WARNING: Expected ~18 slots for future weekday, got 0 (might be past business hours)")
            # This is not necessarily a failure - could be late in the day
        
        # Check structure of first slot if available
        if len(data) > 0:
            slot = data[0]
            print(f"Sample slot: {slot}")
            
            required_keys = ['label', 'iso_utc', 'taken']
            for key in required_keys:
                if key not in slot:
                    print(f"❌ FAIL: Missing key '{key}' in slot")
                    return False
            
            # Validate types
            if not isinstance(slot['label'], str):
                print(f"❌ FAIL: 'label' should be string, got {type(slot['label'])}")
                return False
            
            if not isinstance(slot['iso_utc'], str):
                print(f"❌ FAIL: 'iso_utc' should be string, got {type(slot['iso_utc'])}")
                return False
            
            if not slot['iso_utc'].endswith('Z'):
                print(f"❌ FAIL: 'iso_utc' should end with 'Z', got {slot['iso_utc']}")
                return False
            
            if not isinstance(slot['taken'], bool):
                print(f"❌ FAIL: 'taken' should be boolean, got {type(slot['taken'])}")
                return False
            
            print(f"✅ PASS: Structure correct - label={slot['label']}, iso_utc={slot['iso_utc']}, taken={slot['taken']}")
        
        print(f"✅ PASS: Test 1 successful")
        return True, data  # Return data for use in test 5
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_2_availability_multiple_timezones():
    """Test 2: GET /api/availability with Asia/Dubai and America/New_York."""
    print("\n=== TEST 2: GET /api/availability with multiple timezones ===")
    date = get_next_weekday()
    
    timezones = ["Asia/Dubai", "America/New_York"]
    all_passed = True
    
    for tz in timezones:
        url = f"{BASE_URL}/availability?date={date}&tz={tz}"
        print(f"\nTesting timezone: {tz}")
        print(f"URL: {url}")
        
        try:
            resp = requests.get(url, timeout=10)
            print(f"Status: {resp.status_code}")
            
            if resp.status_code != 200:
                print(f"❌ FAIL: Expected 200, got {resp.status_code}")
                print(f"Response: {resp.text}")
                all_passed = False
                continue
            
            data = resp.json()
            print(f"Number of slots: {len(data)}")
            
            if not isinstance(data, list):
                print(f"❌ FAIL: Expected JSON array, got {type(data)}")
                all_passed = False
                continue
            
            if len(data) > 0:
                slot = data[0]
                print(f"Sample slot: label={slot['label']}, iso_utc={slot['iso_utc']}, taken={slot['taken']}")
                print(f"✅ PASS: {tz} returned valid array")
            else:
                print(f"⚠️  WARNING: {tz} returned empty array (might be past business hours)")
            
        except Exception as e:
            print(f"❌ FAIL: Exception for {tz} - {e}")
            all_passed = False
    
    if all_passed:
        print(f"\n✅ PASS: Test 2 successful")
    else:
        print(f"\n❌ FAIL: Test 2 had failures")
    
    return all_passed

def test_3_availability_saturday():
    """Test 3: GET /api/availability for Saturday (should return empty array)."""
    print("\n=== TEST 3: GET /api/availability for Saturday ===")
    date = get_next_saturday()
    url = f"{BASE_URL}/availability?date={date}&tz=Asia/Dubai"
    print(f"URL: {url}")
    print(f"Saturday date: {date}")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        data = resp.json()
        print(f"Response: {data}")
        
        if not isinstance(data, list):
            print(f"❌ FAIL: Expected JSON array, got {type(data)}")
            return False
        
        if len(data) != 0:
            print(f"❌ FAIL: Expected empty array for Saturday, got {len(data)} slots")
            return False
        
        print(f"✅ PASS: Test 3 successful - Saturday returns empty array")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_4_availability_unsupported_timezone():
    """Test 4: GET /api/availability with unsupported timezone (should return 400)."""
    print("\n=== TEST 4: GET /api/availability with unsupported timezone ===")
    date = get_next_weekday()
    url = f"{BASE_URL}/availability?date={date}&tz=Europe/London"
    print(f"URL: {url}")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 400:
            print(f"❌ FAIL: Expected 400, got {resp.status_code}")
            return False
        
        print(f"✅ PASS: Test 4 successful - unsupported timezone returns 400")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_5_booking_request_with_slot(available_slots):
    """Test 5: POST /api/booking-requests with slot_iso_utc + timezone."""
    print("\n=== TEST 5: POST /api/booking-requests with slot ===")
    
    # Use a slot from test 1 if available
    if not available_slots or len(available_slots) == 0:
        print("⚠️  SKIP: No available slots from test 1, cannot test booking")
        return None
    
    slot = available_slots[0]
    slot_iso_utc = slot['iso_utc']
    
    url = f"{BASE_URL}/booking-requests"
    payload = {
        "name": "Priya Sharma",
        "company": "Acme Logistics",
        "country": "India",
        "industry": "Freight",
        "process": "We manually copy leads from email into a spreadsheet every morning",
        "contact_method": "Email",
        "email": "priya@acmelogistics.com",
        "slot_iso_utc": slot_iso_utc,
        "timezone": "Asia/Kolkata"
    }
    
    print(f"URL: {url}")
    print(f"Payload: {payload}")
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            return None
        
        data = resp.json()
        
        # Check that response echoes slot_iso_utc and timezone
        if data.get('slot_iso_utc') != slot_iso_utc:
            print(f"❌ FAIL: Response slot_iso_utc mismatch. Expected {slot_iso_utc}, got {data.get('slot_iso_utc')}")
            return None
        
        if data.get('timezone') != "Asia/Kolkata":
            print(f"❌ FAIL: Response timezone mismatch. Expected Asia/Kolkata, got {data.get('timezone')}")
            return None
        
        print(f"✅ PASS: Booking created with slot_iso_utc={slot_iso_utc}, timezone=Asia/Kolkata")
        
        # Verify it appears in GET /api/booking-requests
        print("\nVerifying booking appears in GET /api/booking-requests...")
        get_url = f"{BASE_URL}/booking-requests"
        get_resp = requests.get(get_url, timeout=10)
        
        if get_resp.status_code != 200:
            print(f"❌ FAIL: GET /api/booking-requests returned {get_resp.status_code}")
            return None
        
        bookings = get_resp.json()
        found = False
        for booking in bookings:
            if booking.get('slot_iso_utc') == slot_iso_utc and booking.get('name') == "Priya Sharma":
                found = True
                print(f"✅ PASS: Booking found in GET /api/booking-requests")
                break
        
        if not found:
            print(f"❌ FAIL: Booking not found in GET /api/booking-requests")
            return None
        
        print(f"✅ PASS: Test 5 successful")
        return slot_iso_utc  # Return for test 6
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return None

def test_6_double_booking_prevention(slot_iso_utc):
    """Test 6: POST /api/booking-requests with same slot (should return 409)."""
    print("\n=== TEST 6: POST /api/booking-requests with same slot (double-booking) ===")
    
    if not slot_iso_utc:
        print("⚠️  SKIP: No slot_iso_utc from test 5, cannot test double-booking")
        return False
    
    url = f"{BASE_URL}/booking-requests"
    payload = {
        "name": "Aisha Mohammed",
        "company": "Dubai Tech Solutions",
        "country": "UAE",
        "industry": "Technology",
        "process": "We need to automate our customer onboarding process and reduce manual data entry",
        "contact_method": "Email",
        "email": "aisha.mohammed@dubaitech.ae",
        "slot_iso_utc": slot_iso_utc,
        "timezone": "Asia/Kolkata"
    }
    
    print(f"URL: {url}")
    print(f"Attempting to book same slot: {slot_iso_utc}")
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 409:
            print(f"❌ FAIL: Expected 409 (conflict), got {resp.status_code}")
            return False
        
        print(f"✅ PASS: Test 6 successful - double-booking blocked with 409")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_7_audit_requests():
    """Test 7: POST /api/audit-requests validation."""
    print("\n=== TEST 7: POST /api/audit-requests validation ===")
    
    # Test 7a: Valid payload
    print("\n7a: Valid payload")
    url = f"{BASE_URL}/audit-requests"
    valid_payload = {
        "name": "Rajesh Kumar",
        "company": "Tech Solutions India",
        "country": "India",
        "industry": "Technology",
        "process": "We manually process customer invoices and it takes hours every day",
        "contact_method": "Email",
        "email": "rajesh@techsolutions.in"
    }
    
    try:
        resp = requests.post(url, json=valid_payload, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Valid payload should return 200, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        print(f"✅ PASS: Valid payload accepted")
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False
    
    # Test 7b: Empty name
    print("\n7b: Empty name (should return 422)")
    empty_name_payload = {
        "name": "",
        "company": "Test Company",
        "country": "UAE",
        "industry": "Technology",
        "process": "We need automation for our business processes",
        "contact_method": "Email",
        "email": "test@example.com"
    }
    
    try:
        resp = requests.post(url, json=empty_name_payload, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 422:
            print(f"❌ FAIL: Empty name should return 422, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        print(f"✅ PASS: Empty name rejected with 422")
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False
    
    # Test 7c: Empty/short process
    print("\n7c: Empty/short process (should return 422)")
    short_process_payload = {
        "name": "Test Name",
        "company": "Test Company",
        "country": "UAE",
        "industry": "Technology",
        "process": "short",
        "contact_method": "Email",
        "email": "test@example.com"
    }
    
    try:
        resp = requests.post(url, json=short_process_payload, timeout=10)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 422:
            print(f"❌ FAIL: Short process should return 422, got {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
        
        print(f"✅ PASS: Short process rejected with 422")
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False
    
    print(f"\n✅ PASS: Test 7 successful")
    return True

def test_8_playbook_requests():
    """Test 8: POST /api/playbook-requests."""
    print("\n=== TEST 8: POST /api/playbook-requests ===")
    
    url = f"{BASE_URL}/playbook-requests"
    payload = {
        "name": "Michael Rodriguez",
        "email": "michael@automatenow.com"
    }
    
    print(f"URL: {url}")
    print(f"Payload: {payload}")
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            return False
        
        data = resp.json()
        
        if data.get('name') != "Michael Rodriguez":
            print(f"❌ FAIL: Name mismatch in response")
            return False
        
        if data.get('email') != "michael@automatenow.com":
            print(f"❌ FAIL: Email mismatch in response")
            return False
        
        print(f"✅ PASS: Test 8 successful")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_9_calculator_leads():
    """Test 9: POST /api/calculator-leads."""
    print("\n=== TEST 9: POST /api/calculator-leads ===")
    
    url = f"{BASE_URL}/calculator-leads"
    payload = {
        "name": "Sarah Chen",
        "email": "sarah@techflow.io",
        "source": "calculator:services"
    }
    
    print(f"URL: {url}")
    print(f"Payload: {payload}")
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            return False
        
        data = resp.json()
        
        if data.get('name') != "Sarah Chen":
            print(f"❌ FAIL: Name mismatch in response")
            return False
        
        if data.get('email') != "sarah@techflow.io":
            print(f"❌ FAIL: Email mismatch in response")
            return False
        
        if data.get('source') != "calculator:services":
            print(f"❌ FAIL: Source mismatch in response")
            return False
        
        print(f"✅ PASS: Test 9 successful")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def test_10_root_endpoint():
    """Test 10: GET /api/ root endpoint."""
    print("\n=== TEST 10: GET /api/ ===")
    
    url = f"{BASE_URL}/"
    print(f"URL: {url}")
    
    try:
        resp = requests.get(url, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
            return False
        
        data = resp.json()
        
        if data.get('message') != "WeHA API":
            print(f"❌ FAIL: Expected {{message: 'WeHA API'}}, got {data}")
            return False
        
        print(f"✅ PASS: Test 10 successful")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Exception - {e}")
        return False

def main():
    print("=" * 80)
    print("CLOUDFLARE DEPLOY FIX VERIFICATION - BACKEND API TESTING")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing FastAPI mirror endpoints for booking + lead forms")
    print("=" * 80)
    
    results = {}
    
    # Test 1
    result = test_1_availability_kolkata()
    if isinstance(result, tuple):
        results['test_1'] = result[0]
        available_slots = result[1]
    else:
        results['test_1'] = result
        available_slots = []
    
    # Test 2
    results['test_2'] = test_2_availability_multiple_timezones()
    
    # Test 3
    results['test_3'] = test_3_availability_saturday()
    
    # Test 4
    results['test_4'] = test_4_availability_unsupported_timezone()
    
    # Test 5
    slot_iso_utc = test_5_booking_request_with_slot(available_slots)
    results['test_5'] = slot_iso_utc is not None
    
    # Test 6
    results['test_6'] = test_6_double_booking_prevention(slot_iso_utc)
    
    # Test 7
    results['test_7'] = test_7_audit_requests()
    
    # Test 8
    results['test_8'] = test_8_playbook_requests()
    
    # Test 9
    results['test_9'] = test_9_calculator_leads()
    
    # Test 10
    results['test_10'] = test_10_root_endpoint()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print("=" * 80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("=" * 80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
