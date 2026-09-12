# API Client Guide — Frontend Integration Reference

This document provides developer guidelines, request/response conventions, error formats, pagination parameters, file upload patterns, and GitHub integration specs for frontend developers or AI agents building the UI.

---

## 1. Base URL & Environment

- **Development Base URL**: `http://localhost:5001/api`
- **CORS Allowed Origins**: Default `http://localhost:5173` (Vite dev server) with `credentials: true`.

---

## 2. Standard Request & Response Headers

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Response Headers
```http
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## 3. Response Conventions

### A. Success Response (Read / Fetch)
```json
{
  "success": true,
  "data": { ... } // or [ ... ]
}
```

### B. Success Response (Create / Update / Action)
```json
{
  "success": true,
  "message": "Deliverable submitted for review successfully",
  "data": { ... }
}
```

### C. Success Response (Delete / Action without Data)
```json
{
  "success": true,
  "message": "Bug deleted successfully"
}
```

### D. Error Response Format (Enforced across all controllers)
```json
{
  "success": false,
  "error": "Human-readable error description"
}
```

---

## 4. HTTP Status Code Reference

| Status Code | Meaning | Cause / Scenario |
|:---:|---|---|
| **`200 OK`** | Success | Successful GET, PUT, PATCH, or DELETE |
| **`201 Created`** | Created | Successful POST entity creation |
| **`400 Bad Request`** | Validation Error | Missing required fields, invalid format, bad parameters |
| **`401 Unauthorized`** | Auth Failure | Missing token, invalid signature, or expired JWT |
| **`403 Forbidden`** | Permission Denied | User role or team role lacks permission for action |
| **`404 Not Found`** | Not Found | Target record or route does not exist |
| **`409 Conflict`** | Resource Conflict | Duplicate email registration or unique constraint violation |
| **`422 Unprocessable`** | State Machine Error | Invalid status transition (e.g. DRAFT → APPROVED directly) |
| **`500 Internal Error`** | Server Exception | Uncaught backend exception |
| **`502 Bad Gateway`** | Third-Party Error | External GitHub API failure |

---

## 5. Pagination, Filtering, and Sorting

Selected endpoints support query parameter pagination and filtering:

### A. Activity Logs: `GET /api/projects/:projectId/activity`
- **Query Params**:
  - `page`: Page number (default: `1`)
  - `pageSize`: Items per page (default: `20`)
- **Response**:
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
  ```

### B. Product Backlog: `GET /api/backlog/:projectId`
- Automatically sorted by `order` integer ascending.

---

## 6. File Upload Behavior

Currently, CapstoneHub handles file attachments via **URL reference** rather than binary multipart uploads.

- **Deliverable URL field**: `fileUrl: "https://example.com/document.pdf"`
- **Frontend Recommendation**: Provide a text input or connect to a cloud storage provider (e.g., AWS S3 or Cloudinary) to generate a public/presigned URL, then submit that URL string to `/api/deliverables`.

---

## 7. GitHub API Integration Behavior

The backend acts as a proxy to the official **GitHub REST API**.

- **Endpoints**:
  - `GET /api/projects/:id/github/commits`
  - `GET /api/projects/:id/github/branches`
  - `GET /api/projects/:id/github/pulls`
  - `GET /api/projects/:id/github/contributors`
  - `GET /api/projects/:id/github/activity`
- **Behavior**:
  - Requires a valid `GitHubConnection` configured for the project.
  - If no repository is connected, returns `404 Not Found` with `{ "success": false, "error": "No GitHub repository connected to this project" }`.
  - Proxies parameters like `page`, `per_page`, `state`, `branch` directly to GitHub API.
  - Gracefully maps GitHub rate-limiting errors to `HTTP 429` and unreachable errors to `HTTP 502`.
