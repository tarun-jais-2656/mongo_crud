export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Blog API",
    version: "1.0.0",
    description:
      "A blog REST API built with Express, TypeScript and Mongoose. Signup and login require HTTP Basic auth using BasicAuth and Password from .env (`Authorization: Basic base64(BasicAuth:Password)`). The account email and password go in the JSON body. Every route after login requires `Authorization: Bearer <token>`. Sessions are stored in MongoDB.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Posts" },
    { name: "Comments" },
    { name: "Stats" },
  ],
  components: {
    securitySchemes: {
      basicAuth: { type: "http", scheme: "basic" },
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer", example: 401 },
          message: { type: "string", example: "Invalid email or password" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 57 },
          totalPages: { type: "integer", example: 6 },
        },
      },
      SignupInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Ada Lovelace" },
          email: { type: "string", example: "ada@example.com" },
          password: { type: "string", example: "supersecret1" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "ada@example.com" },
          password: { type: "string", example: "supersecret1" },
        },
      },
      PostInput: {
        type: "object",
        required: ["title", "body"],
        properties: {
          title: { type: "string", example: "My first post" },
          body: {
            type: "string",
            example: "A body with at least twenty characters.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["mongodb", "express"],
          },
          status: {
            type: "string",
            enum: ["draft", "published"],
            example: "published",
          },
        },
      },
      CommentInput: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", example: "Great post!" } },
      },
      UpdateNameInput: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", example: "Ada L." } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        responses: { "200": { description: "Service is up" } },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a user (Basic auth from .env, account details in the body)",
        security: [{ basicAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupInput" },
            },
          },
        },
        responses: {
          "201": { description: "User created" },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in (Basic auth from .env, account email and password in the body)",
        security: [{ basicAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Logged in. Response includes the session token; send it as Authorization: Bearer <token>.",
          },
          "401": { description: "Invalid email or password" },
          "429": { description: "Too many failed attempts" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out of the current session",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Log out of every device (bonus)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "All sessions removed" } },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Profile" },
          "401": { description: "Not authenticated" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update your name",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateNameInput" },
            },
          },
        },
        responses: { "200": { description: "Updated profile" } },
      },
    },
    "/users/me/posts": {
      get: {
        tags: ["Users"],
        summary: "Current user's posts (drafts included)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: { "200": { description: "Paginated list of the user's posts" } },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List published posts",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, maximum: 50 },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "tag", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "mostCommented"],
              default: "newest",
            },
          },
        ],
        responses: {
          "200": { description: "Paginated list (body omitted)" },
          "401": { description: "Not authenticated" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostInput" },
            },
          },
        },
        responses: {
          "201": { description: "Post created" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get one published post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Post" },
          "400": { description: "Invalid id" },
          "401": { description: "Not authenticated" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update a post (author only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostInput" },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Not the author" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete a post + its comments (author only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Not the author" },
        },
      },
    },
    "/posts/{id}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List a post comments (newest first)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "after",
            in: "query",
            schema: { type: "string" },
            description: "Cursor pagination (bonus): last comment id",
          },
        ],
        responses: {
          "200": { description: "Comments" },
          "401": { description: "Not authenticated" },
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Comment on a published post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommentInput" },
            },
          },
        },
        responses: { "201": { description: "Comment created" } },
      },
    },
    "/comments/{id}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (comment author or post author)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Not allowed" },
        },
      },
    },
    "/stats": {
      get: {
        tags: ["Stats"],
        summary: "Blog statistics (one aggregation)",
        security: [{ basicAuth: [] }],
        responses: {
          "200": { description: "Stats" },
          "401": { description: "Basic authentication required" },
        },
      },
    },
  },
} as const;
