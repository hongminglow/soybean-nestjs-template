🔹 AUTH APIs
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

🔹 USER MANAGEMENT
GET /api/users
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}

🔹 TEMPLATE MANAGEMENT
GET /api/templates
GET /api/templates/{id}
POST /api/templates
PUT /api/templates/{id}
DELETE /api/templates/{id}

🔹 TEMPLATE LANGUAGE CONTENT
POST /api/templates/{id}/contents
PUT /api/template-contents/{id}
DELETE /api/template-contents/{id}

🔹 TEMPLATE VARIABLES
POST /api/templates/{id}/variables
PUT /api/template-variables/{id}
DELETE /api/template-variables/{id}

🔹 CORE API (Main Business API)
POST /api/sms/generate

🔹 SMS REQUEST MANAGEMENT
GET /api/sms/requests
GET /api/sms/requests/{id}

🔹 DASHBOARD
GET /api/dashboard/stats?period=daily
GET /api/dashboard/stats?period=monthly

🔹 SYSTEM SETTINGS
GET /api/settings
PUT /api/settings

🔹 API CLIENT MANAGEMENT (Recommended)
POST /api/api-clients
GET /api/api-clients
DELETE /api/api-clients/{id}
