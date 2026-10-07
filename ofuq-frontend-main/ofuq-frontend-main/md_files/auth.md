base url: /api
<!-- sign up endpoint -->
POST /auth/signup
<!-- sign up request body -->
 {
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "password": "secret123",
    "password_confirmation": "secret123"
  }
<!-- sign up response body -->
{
    "user": {
        "id": 15,
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "role": "student"
    },
    "token": "14|bZL9BNM8GVk1448gtSyKUOkQHA7XG19iweUVLtwSe6413247"
}

<!-- sign in endpoint -->
POST /auth/signin
<!-- sign in request body -->
{
    "email": "ahmed@example.com",
    "password": "secret123"
}
<!-- sign in response body -->
{
    "user": {
        "id": 15,
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "role": "student"
    },
    "token": "14|bZL9BNM8GVk1448gtSyKUOkQHA7XG19iweUVLtwSe6413247"
}

<!-- sign out endpoint -->
POST /auth/signout 
<!-- sign out response body -->
{
    "message": "Successfully signed out"
}

<!-- get user endpoint -->
GET /auth/user
<!-- get user response body -->
{
    "user": {
        "id": 15,
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "role": "student"
    }
}

