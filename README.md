# Link-Note

A note-taking api with folder organization and linking capabilities.

## Features

- User authentication (register/login)
- CRUD operations for notes
- Folder organization system
- Note linking functionality
- Error handling middleware
- Authentication middleware

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

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/me` - Get current user info

### Notes

- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Folders

- `GET /api/folders` - Get all folders
- `GET /api/folders/:id` - Get folder by ID
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder
- `PATCH /api/folders/move` - Move folder
- `DELETE /api/folders/:id` - Delete folder

## Database Models

### User

- _id: ObjectId (auto-generated)
- firstName: String (required, unique)
- lastName: String (required, unique)
- email: String (required, unique)
- password: String (required)
- createdAt: Date
- updatedAt: Date

### Note

- _id: ObjectId (auto-generated)
- userId: ObjectId (ref: User)
- title: String (required)
- content: String (required)
- tags: [String]
- linksTo: [ObjectId] (ref: Note)
- folderId: ObjectId (ref: Folder)
- createdAt: Date
- updatedAt: Date

### Folder

- _id: ObjectId (auto-generated)
- userId: ObjectId (ref: User)
- name: String (required)
- description: String
- parentFolderId: ObjectId (ref: Folder)
- childrenFolders: [ObjectId] (ref: Folder)
- notes: [ObjectId] (ref: Note)
- tags: [String]
- isRoot: Boolean
- createdAt: Date
- updatedAt: Date

## Testing

Run tests with:

```bash
npm test
```

## License

MIT

