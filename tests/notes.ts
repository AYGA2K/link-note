import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { errorHandler } from "../src/middlewares/errorHandler";
import Folder, { type IFolder } from "../src/models/folder";
import Note from "../src/models/note";
import User, { type IUser } from "../src/models/user";
import noteRouter from "../src/routes/note";
import { MongoMemoryServer } from "mongodb-memory-server";
const app = express();
app.use(express.json());
app.use("/notes", noteRouter);
app.use(errorHandler);

let mongo: MongoMemoryServer;

describe("Note API (Integration Tests)", () => {
	let testUser: IUser;
	let testFolder: IFolder;
	let authToken: string;
	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		const uri = mongo.getUri();

		await mongoose.connect(uri);

		// Create a test user and get auth token
		testUser = await new User({
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "password123",
		}).save();

		// In a real app, you'd generate a proper token after login
		authToken = `mock-token-for-user-${testUser._id}`;

		// Create a test folder
		testFolder = await new Folder({
			userId: testUser._id,
			name: "Test Folder",
			description: "Test Description",
		}).save();
	});

	beforeEach(async () => {
		// Clear the notes database before each test
		await Note.deleteMany({});
	});

	afterAll(async () => {
		// Clean up all test data
		await Note.deleteMany({});
		await Folder.deleteMany({});
		await User.deleteMany({});
		await mongoose.disconnect();
		await mongo.stop();
	});

	// --- Tests ---
	describe("CRUD Operations", () => {
		let createdNoteId: string;

		// CREATE
		it("POST /notes → should create a new note", async () => {
			const newNote = {
				userId: testUser.id,
				title: "Test Note",
				content: "Test Content",
				tags: ["tag1"],
				folderId: testFolder.id,
			};

			const res = await request(app)
				.post("/notes")
				.set("Authorization", `Bearer ${authToken}`)
				.send(newNote);

			expect(res.status).toBe(201);
			expect(res.body).toMatchObject({
				title: newNote.title,
				content: newNote.content,
				userId: testUser.id,
				folderId: testFolder.id,
			});
			createdNoteId = res.body.id;
		});

		// READ
		it("GET /notes → should retrieve all notes", async () => {
			// First create a note to retrieve
			const note = await Note.create({
				userId: testUser.id,
				title: "Test Note",
				content: "Test Content",
				folderId: testFolder.id,
			});

			const res = await request(app)
				.get("/notes")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBe(1);
			expect(res.body[0]._id).toBe(note.id.toString());
		});

		it("GET /notes/:id → should retrieve a specific note", async () => {
			// First create a note to retrieve
			const note = await Note.create({
				userId: testUser.id,
				title: "Test Note",
				content: "Test Content",
				folderId: testFolder.id,
			});

			const res = await request(app)
				.get(`/notes/${note.id}`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body._id).toBe(note.id);
		});

		// UPDATE
		it("PUT /notes/:id → should update a note", async () => {
			// First create a note to update
			const note = await Note.create({
				userId: testUser._id,
				title: "Original Title",
				content: "Original Content",
				folderId: testFolder.id,
			});

			const updatedData = {
				title: "Updated Title",
				content: "Updated Content",
				id: note.id,
				userId: testUser.id,
			};

			const res = await request(app)
				.put(`/notes/${note.id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedData);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe(updatedData.title);
			expect(res.body.content).toBe(updatedData.content);

			// Verify the update in database
			const updatedNote = await Note.findById(note.id);
			expect(updatedNote?.title).toBe(updatedData.title);
		});

		// DELETE
		it("DELETE /notes/:id → should delete a note", async () => {
			// First create a note to delete
			const note = await Note.create({
				userId: testUser.id,
				title: "Note to Delete",
				content: "Content",
				folderId: testFolder.id,
			});

			const res = await request(app)
				.delete(`/notes/${note.id}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.status).toBe(200);

			// Verify deletion
			const checkRes = await request(app)
				.get(`/notes/${note.id}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(checkRes.status).toBe(404);
		});
	});

	// --- Validation Tests ---
	describe("Validation", () => {
		it("should reject POST with missing title (400 Bad Request)", async () => {
			const newNote = {
				userId: testUser.id,
				content: "Test Content",
				tags: ["tag1"],
				folderId: testFolder.id,
			};

			const res = await request(app)
				.post("/notes")
				.set("Authorization", `Bearer ${authToken}`)
				.send(newNote);

			expect(res.status).toBe(400);
		});
	});

	// --- Error Handling ---
	describe("Error Handling", () => {
		it("should return 404 for non-existent note", async () => {
			const fakeId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.get(`/notes/${fakeId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.status).toBe(404);
		});
	});
});
