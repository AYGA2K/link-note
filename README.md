# Link-Note

A note-taking api with folder organization and linking capabilities.

## Features

- User authentication (register/login)
- CRUD operations for notes
- Folder organization system
- Note linking functionality
- Error handling middleware

## Tech Stack

- Node.js
- Express
- MongoDB
- TypeScript
- JWT for authentication

## Project Structure

```
link-note/
├── src/
│   ├── controllers/    # Route handlers
│   ├── database/       # DB connection
│   ├── middlewares/    # Express middlewares
│   ├── models/         # MongoDB models
│   └── routes/         # API routes
├── tests/              # Integration tests
├── .env-example        # Environment variables template
└── package.json        # Project dependencies
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env-example`
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET/POST/PUT/DELETE /api/notes` - Note operations
- `GET/POST/PUT/DELETE /api/folders` - Folder operations

## Testing

Run tests with:
```bash
npm test
```

## License

MIT