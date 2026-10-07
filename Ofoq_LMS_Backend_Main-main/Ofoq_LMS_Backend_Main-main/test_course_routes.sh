#!/bin/bash

# Course Routes Testing Script
# Tests all routes related to /api/course/ and /api/admin/course/

# Configuration
BASE_URL="https://back.ofuq.academy"
ADMIN_EMAIL="admin@ofuq.academy"
ADMIN_PASSWORD="admin123"
COURSE_ID=3  # Test with course ID 3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to test a route
test_route() {
    local method=$1
    local route=$2
    local description=$3
    local auth_required=$4
    local data=$5
    
    echo ""
    print_info "Testing: $description"
    echo "Route: $method $route"
    
    if [ "$auth_required" = "true" ]; then
        if [ -z "$TOKEN" ]; then
            print_error "No authentication token available"
            return 1
        fi
        
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$route" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Accept: application/json")
        elif [ "$method" = "POST" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$route" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "$data")
        elif [ "$method" = "PUT" ]; then
            response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$route" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "$data")
        elif [ "$method" = "DELETE" ]; then
            response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$route" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Accept: application/json")
        fi
    else
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$route" \
                -H "Accept: application/json")
        fi
    fi
    
    # Extract HTTP status code (last line)
    http_code=$(echo "$response" | tail -n1)
    # Extract response body (all lines except last)
    body=$(echo "$response" | sed '$d')
    
    # Check status code
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Status: $http_code - Success"
        # Show first 200 characters of response
        echo "Response preview: $(echo "$body" | head -c 200)..."
    elif [ "$http_code" = "404" ]; then
        print_error "Status: $http_code - Not Found"
        echo "Response: $body"
    elif [ "$http_code" = "401" ]; then
        print_error "Status: $http_code - Unauthorized"
    elif [ "$http_code" = "403" ]; then
        print_error "Status: $http_code - Forbidden"
    elif [ "$http_code" = "422" ]; then
        print_warning "Status: $http_code - Validation Error"
        echo "Response: $body"
    else
        print_warning "Status: $http_code"
        echo "Response: $body"
    fi
}

# Start testing
print_header "Course Routes Testing Script"
echo "Base URL: $BASE_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo "Test Course ID: $COURSE_ID"

# Step 1: Login and get token
print_header "Step 1: Authentication"
print_info "Logging in as admin..."

login_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"login\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

http_code=$(echo "$login_response" | tail -n1)
body=$(echo "$login_response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    print_success "Login successful!"
    
    # Extract token using grep and sed
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    
    if [ -z "$TOKEN" ]; then
        print_error "Failed to extract token from response"
        echo "Response: $body"
        exit 1
    fi
    
    print_success "Token obtained: ${TOKEN:0:20}..."
else
    print_error "Login failed with status: $http_code"
    echo "Response: $body"
    exit 1
fi

# Step 2: Test Public Course Routes
print_header "Step 2: Testing Public Course Routes"

test_route "GET" "/api/course/$COURSE_ID" "Get single course (public)" "false"
test_route "GET" "/api/allCourses" "Get all courses (public)" "false"
test_route "GET" "/api/courses/featured" "Get featured courses (public)" "false"
test_route "GET" "/api/courses/$COURSE_ID/reviews" "Get course reviews (public)" "false"

# Step 3: Test Authenticated Course Routes
print_header "Step 3: Testing Authenticated Course Routes"

test_route "GET" "/api/courseEnroll/$COURSE_ID" "Get course for enrollment" "true"
test_route "POST" "/api/courses/$COURSE_ID/enroll" "Enroll in course" "true" "{}"
test_route "GET" "/api/courses/$COURSE_ID/progress" "Get course progress" "true"
test_route "GET" "/api/my-enrollments" "Get my enrollments" "true"

# Step 4: Test Final Exam Routes
print_header "Step 4: Testing Final Exam Routes"

test_route "GET" "/api/courses/$COURSE_ID/final-exam/meta" "Get final exam metadata" "true"
test_route "GET" "/api/courses/$COURSE_ID/final-exam/attempt/active" "Get active exam attempt" "true"
test_route "GET" "/api/my-tests" "Get my tests" "true"

# Step 5: Test Certificate Routes
print_header "Step 5: Testing Certificate Routes"

test_route "GET" "/api/courses/$COURSE_ID/certificate-status" "Get certificate status" "true"
test_route "GET" "/api/courses/$COURSE_ID/certificate/data" "Get certificate data" "true"
test_route "GET" "/api/my-certificates" "Get my certificates" "true"

# Step 6: Test Review Routes
print_header "Step 6: Testing Review Routes (Authenticated)"

test_route "POST" "/api/courses/$COURSE_ID/reviews" "Create review" "true" '{"rating":5,"comment":"Test review"}'

# Step 7: Test Admin Course Routes
print_header "Step 7: Testing Admin Course Routes"

test_route "GET" "/api/admin/courses" "Get all courses (admin)" "true"
test_route "GET" "/api/admin/course/$COURSE_ID" "Get single course (admin)" "true"
test_route "GET" "/api/admin/courses/$COURSE_ID" "Get course details (admin)" "true"
test_route "GET" "/api/admin/courses-details" "Get courses details (admin)" "true"
test_route "GET" "/api/admin/courses-not-published" "Get unpublished courses (admin)" "true"

# Step 8: Test Admin Chapter Routes
print_header "Step 8: Testing Admin Chapter Routes"

test_route "POST" "/api/admin/courses/$COURSE_ID/chapters" "Create chapter (admin)" "true" '{"title":"Test Chapter","order":999}'

# Summary
print_header "Testing Complete!"
print_info "All routes have been tested"
print_info "Check the output above for any failures"

echo ""
echo "Note: Some routes may fail due to business logic (e.g., already enrolled, no certificate available)"
echo "404 errors on course routes indicate the original issue is NOT fixed"
echo ""
