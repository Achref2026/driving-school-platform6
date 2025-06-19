import requests
import sys
import json
import random
import string
from datetime import datetime

class DrivingSchoolAPITester:
    def __init__(self, base_url="https://e0890b28-e7c6-4b8b-bb87-56e993a29411.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        print(f"Using API base URL: {self.base_url}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, form_data=False):
        """Run a single API test"""
        # Handle special case for endpoints that don't have /api prefix
        if endpoint.startswith("../"):
            url = f"{self.base_url}/{endpoint[3:]}"
        else:
            url = f"{self.base_url}/api/{endpoint}"
        
        print(f"Testing URL: {url}")
        
        if headers is None:
            headers = {}
            
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if not files and not form_data and 'Content-Type' not in headers:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                elif form_data:
                    response = requests.post(url, data=data, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            # Try to parse response as JSON
            response_data = {}
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text[:200] + "..." if len(response.text) > 200 else response.text}
            
            result = {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response": response_data
            }
            
            self.test_results.append(result)
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        # Health check doesn't have /api prefix
        return self.run_test(
            "Health Check",
            "GET",
            "../health",  # Go up one level to remove /api prefix
            200
        )

    def test_get_states(self):
        """Test getting the list of states"""
        return self.run_test(
            "Get States",
            "GET",
            "states",
            200
        )

    def test_register_user(self):
        """Test user registration"""
        # Generate random user data
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        email = f"test_user_{random_suffix}@example.com"
        
        # Create form data
        form_data = {
            "email": email,
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+213123456789",
            "address": "123 Test Street",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "state": "Alger"
        }
        
        success, response = self.run_test(
            "Register User",
            "POST",
            "auth/register",
            200,
            data=form_data,
            form_data=True
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response['user']
            return True, response
        return False, response

    def test_login(self, email="test@example.com", password="Test123!"):
        """Test login with existing credentials"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response['user']
            return True, response
        return False, response

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test(
            "Get Current User",
            "GET",
            "users/me",
            200
        )

    def test_get_dashboard(self):
        """Test getting dashboard data"""
        return self.run_test(
            "Get Dashboard",
            "GET",
            "dashboard",
            200
        )

    def test_get_driving_schools(self):
        """Test getting list of driving schools"""
        return self.run_test(
            "Get Driving Schools",
            "GET",
            "driving-schools",
            200
        )

    def test_get_driving_schools_with_filters(self):
        """Test getting driving schools with filters"""
        return self.run_test(
            "Get Driving Schools with Filters",
            "GET",
            "driving-schools?state=Alger&min_price=10000&max_price=50000&sort_by=price&sort_order=asc",
            200
        )

    def test_get_documents(self):
        """Test getting user documents"""
        return self.run_test(
            "Get User Documents",
            "GET",
            "documents",
            200
        )

    def test_get_notifications(self):
        """Test getting user notifications"""
        return self.run_test(
            "Get User Notifications",
            "GET",
            "notifications",
            200
        )

    def test_get_courses(self):
        """Test getting user courses"""
        return self.run_test(
            "Get User Courses",
            "GET",
            "courses",
            200
        )

    def test_enroll_in_school(self, school_id=None):
        """Test enrolling in a driving school"""
        if not school_id:
            # First get available schools
            success, schools_response = self.test_get_driving_schools()
            if success and 'schools' in schools_response and len(schools_response['schools']) > 0:
                school_id = schools_response['schools'][0]['id']
            else:
                print("❌ No schools available for enrollment test")
                return False, {}
        
        return self.run_test(
            "Enroll in School",
            "POST",
            "enroll",
            200,
            data={"school_id": school_id}
        )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"📊 API TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        # Group by success/failure
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['name']} ({test['method']} {test['endpoint']})")
                print(f"    Expected: {test['expected_status']}, Got: {test.get('actual_status', 'Error')}")
                if 'error' in test:
                    print(f"    Error: {test['error']}")
                elif 'response' in test:
                    print(f"    Response: {json.dumps(test['response'], indent=2)[:200]}...")
        
        return self.tests_passed == self.tests_run

def test_manager_dashboard_and_role_change():
    """
    Comprehensive test for manager dashboard and role change bug fix.
    This test verifies the critical bug fix where approving a student enrollment
    correctly changes the user role from "guest" to "student".
    """
    print("\n" + "="*50)
    print("🧪 TESTING MANAGER DASHBOARD & ROLE CHANGE BUG FIX")
    print("="*50)
    
    base_url = "http://localhost:8001"
    
    # Create a manager account
    manager_tester = DrivingSchoolAPITester(base_url)
    manager_email = f"manager_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    
    print("\n📋 PHASE 1: Creating Manager Account & School")
    manager_success, manager_data = manager_tester.test_register_user()
    
    if not manager_success:
        print("❌ Failed to create manager account")
        return False
    
    print(f"✅ Created manager account: {manager_email}")
    
    # Register a driving school
    # First, we need to create a school registration endpoint test
    def test_register_school(tester):
        school_name = f"Test School {datetime.now().strftime('%Y%m%d%H%M%S')}"
        school_data = {
            "name": school_name,
            "address": "123 Test Street",
            "state": "Alger",
            "phone": "+213123456789",
            "email": f"school_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            "description": "Test driving school for API testing",
            "price": 15000
        }
        
        return tester.run_test(
            "Register Driving School",
            "POST",
            "driving-schools",
            200,
            data=school_data
        )
    
    school_success, school_data = test_register_school(manager_tester)
    
    if not school_success or 'school' not in school_data:
        print("❌ Failed to register driving school")
        return False
    
    school_id = school_data['school']['id']
    print(f"✅ Registered driving school with ID: {school_id}")
    
    # Create a guest user account
    print("\n📋 PHASE 2: Creating Guest User & Testing Enrollment")
    guest_tester = DrivingSchoolAPITester(base_url)
    guest_email = f"guest_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    
    guest_success, guest_data = guest_tester.test_register_user()
    
    if not guest_success:
        print("❌ Failed to create guest account")
        return False
    
    print(f"✅ Created guest account: {guest_email}")
    
    # Verify initial role is "guest"
    if guest_tester.user['role'] != 'guest':
        print(f"❌ Expected initial role to be 'guest', got '{guest_tester.user['role']}'")
        return False
    
    print(f"✅ Initial user role is correctly set to 'guest'")
    
    # Enroll in the school
    enroll_success, enroll_data = guest_tester.test_enroll_in_school(school_id)
    
    if not enroll_success or 'enrollment_id' not in enroll_data:
        print("❌ Failed to enroll in driving school")
        return False
    
    enrollment_id = enroll_data['enrollment_id']
    print(f"✅ Enrolled in driving school with enrollment ID: {enrollment_id}")
    
    # Upload required documents
    print("\n📋 PHASE 3: Uploading Required Documents")
    
    # Create a dummy document file
    with open('dummy_document.jpg', 'w') as f:
        f.write("This is a dummy document for testing")
    
    # Add document upload test method
    def test_upload_document(tester, doc_type):
        files = {'file': ('dummy_document.jpg', open('dummy_document.jpg', 'rb'), 'image/jpeg')}
        data = {'document_type': doc_type}
        
        return tester.run_test(
            f"Upload {doc_type}",
            "POST",
            "documents/upload",
            200,
            data=data,
            files=files
        )
    
    # Upload all required documents
    required_docs = ["profile_photo", "id_card", "medical_certificate", "residence_certificate"]
    for doc_type in required_docs:
        doc_success, _ = test_upload_document(guest_tester, doc_type)
        if not doc_success:
            print(f"❌ Failed to upload {doc_type}")
        else:
            print(f"✅ Uploaded {doc_type}")
    
    # Test manager dashboard and enrollment approval
    print("\n📋 PHASE 4: Testing Manager Dashboard & Enrollment Approval")
    
    # Add manager endpoints test methods
    def test_get_manager_enrollments(tester):
        return tester.run_test(
            "Get Manager Enrollments",
            "GET",
            "manager/enrollments",
            200
        )
    
    def test_accept_enrollment(tester, enrollment_id):
        return tester.run_test(
            "Accept Enrollment",
            "POST",
            f"manager/enrollments/{enrollment_id}/accept",
            200,
            data={}
        )
    
    # Get manager enrollments
    enrollments_success, enrollments_data = test_get_manager_enrollments(manager_tester)
    
    if not enrollments_success or 'enrollments' not in enrollments_data:
        print("❌ Failed to get manager enrollments")
        return False
    
    print(f"✅ Retrieved {len(enrollments_data['enrollments'])} enrollments")
    
    # Find our enrollment
    found_enrollment = None
    for enrollment in enrollments_data['enrollments']:
        if enrollment['id'] == enrollment_id:
            found_enrollment = enrollment
            break
    
    if not found_enrollment:
        print("❌ Could not find our enrollment in manager's enrollments")
        return False
    
    print(f"✅ Found enrollment with status: {found_enrollment['enrollment_status']}")
    
    # Accept the enrollment
    accept_success, _ = test_accept_enrollment(manager_tester, enrollment_id)
    
    if not accept_success:
        print("❌ Failed to accept enrollment")
        return False
    
    print("✅ Successfully accepted enrollment")
    
    # CRITICAL BUG FIX TEST: Check if user role changed to "student"
    print("\n📋 PHASE 5: Verifying Role Change Bug Fix")
    
    # Login again to refresh user data
    guest_tester.test_login(guest_email, "Test123!")
    
    # Get current user info
    user_success, user_data = guest_tester.test_get_current_user()
    
    if not user_success:
        print("❌ Failed to get user info after enrollment approval")
        return False
    
    # Check if role changed from "guest" to "student"
    if user_data['role'] == 'student':
        print("✅ CRITICAL BUG FIX VERIFIED: User role changed from 'guest' to 'student'")
    else:
        print(f"❌ BUG STILL EXISTS: User role is '{user_data['role']}', expected 'student'")
        return False
    
    return True

def test_states_and_schools_loading():
    """
    Specific test for the states and driving schools loading issues
    that were reported by the user.
    """
    print("\n" + "="*50)
    print("🧪 TESTING STATES AND DRIVING SCHOOLS LOADING")
    print("="*50)
    
    # Use the public URL from the frontend .env file
    base_url = "https://e0890b28-e7c6-4b8b-bb87-56e993a29411.preview.emergentagent.com"
    
    # Setup tester
    tester = DrivingSchoolAPITester(base_url)
    
    # Test states loading
    print("\n📋 PHASE 1: Testing States API")
    states_success, states_data = tester.test_get_states()
    
    if not states_success:
        print("❌ Failed to get states")
        return False
    
    # Verify we have all 58 Algerian states
    if 'states' in states_data and len(states_data['states']) == 58:
        print(f"✅ Successfully retrieved all 58 Algerian states")
    else:
        state_count = len(states_data.get('states', []))
        print(f"❌ Expected 58 states, got {state_count}")
        return False
    
    # Test driving schools loading
    print("\n📋 PHASE 2: Testing Driving Schools API")
    schools_success, schools_data = tester.test_get_driving_schools()
    
    if not schools_success:
        print("❌ Failed to get driving schools")
        return False
    
    # Verify we have schools data
    if 'schools' in schools_data and len(schools_data['schools']) > 0:
        print(f"✅ Successfully retrieved {len(schools_data['schools'])} driving schools")
    else:
        print("❌ No driving schools found in the response")
        return False
    
    # Test filtering by state
    print("\n📋 PHASE 3: Testing Driving Schools Filtering by State")
    filter_success, filter_data = tester.run_test(
        "Get Driving Schools filtered by Alger",
        "GET",
        "driving-schools?state=Alger",
        200
    )
    
    if not filter_success:
        print("❌ Failed to filter driving schools by state")
        return False
    
    # Verify filtered schools
    if 'schools' in filter_data:
        alger_schools = filter_data['schools']
        print(f"✅ Successfully filtered schools by state 'Alger', found {len(alger_schools)} schools")
        
        # Verify all returned schools are in Alger
        all_in_alger = all(school['state'] == 'Alger' for school in alger_schools)
        if all_in_alger:
            print("✅ All filtered schools are correctly in Alger state")
        else:
            print("❌ Some filtered schools are not in Alger state")
            return False
    else:
        print("❌ No schools data in filtered response")
        return False
    
    return True

def main():
    # Use the public URL from the frontend .env file
    base_url = "https://e0890b28-e7c6-4b8b-bb87-56e993a29411.preview.emergentagent.com"
    
    # Test the specific issues reported by the user
    states_schools_test_passed = test_states_and_schools_loading()
    
    # Setup tester for basic API tests
    tester = DrivingSchoolAPITester(base_url)
    
    # Run tests without authentication
    tester.test_health_check()
    tester.test_get_states()
    tester.test_get_driving_schools()
    tester.test_get_driving_schools_with_filters()
    
    # Print summary
    all_passed = tester.print_summary()
    
    # Include states and schools loading test result in final assessment
    if not states_schools_test_passed:
        all_passed = False
        print("\n❌ STATES AND DRIVING SCHOOLS LOADING TEST FAILED")
    else:
        print("\n✅ STATES AND DRIVING SCHOOLS LOADING TEST PASSED")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())