import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { errorHandler } from "../src/middlewares/errorHandler";
import Folder, { type IFolder } from "../src/models/folder";
import User, { type IUser } from "../src/models/user";
import folderRouter from "../src/routes/folder";
import { MongoMemoryServer } from "mongodb-memory-server";

const app = express();
app.use(express.json());
app.use("/folders", folderRouter);
app.use(errorHandler);

let mongo: MongoMemoryServer;
describe("Folder API (Integration Tests)", () => {
	let testUser: IUser;
	let authToken: string;
	let rootFolder: IFolder;

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		const uri = mongo.getUri();

		await mongoose.connect(uri);

		// Create test user
		testUser = await User.create({
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "password123",
		});

		// Mock auth token
		authToken = `mock-token-for-user-${testUser.id}`;
	});

	beforeEach(async () => {
		// Clear the folders database before each test
		await Folder.deleteMany({});
		rootFolder = await Folder.create({
			userId: testUser.id,
			name: "Root",
			isRoot: true,
		});
	});

	afterAll(async () => {
		await Folder.deleteMany({});
		await User.deleteMany({});
		await mongoose.disconnect();
		await mongo.stop();
	});

	describe("CRUD Operations", () => {
		it("POST /folders → should create a new folder", async () => {
			const newFolder = {
				userId: testUser._id,
				name: "Test Folder",
				description: "Test Description",
				parentFolderId: rootFolder.id,
			};

			const res = await request(app)
				.post("/folders")
				.set("Authorization", `Bearer ${authToken}`)
				.send(newFolder);

			expect(res.status).toBe(201);
			expect(res.body).toMatchObject({
				name: newFolder.name,
				description: newFolder.description,
				parentFolderId: newFolder.parentFolderId,
			});

			// Verify parent folder was updated
			const parent = await Folder.findById(rootFolder.id);
			expect(parent?.childrenFolders.map(String)).toContain(
				String(res.body._id),
			);
		});

		it("GET /folders → should retrieve all folders", async () => {
			const res = await request(app)
				.get("/folders")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBe(1); // Just the root folder
		});

		it("GET /folders/:id → should retrieve a specific folder", async () => {
			const res = await request(app)
				.get(`/folders/${rootFolder.id}`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body._id).toBe(rootFolder.id);
		});

		it("PUT /folders/:id → should update a folder", async () => {
			const updates = {
				name: "Updated Name",
				description: "Updated Description",
				tags: ["tag1", "tag2"],
			};

			const res = await request(app)
				.put(`/folders/${rootFolder._id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updates);

			expect(res.status).toBe(200);
			expect(res.body.name).toBe(updates.name);
			expect(res.body.description).toBe(updates.description);
			expect(res.body.tags).toEqual(updates.tags);
		});
	});

	describe("Folder Structure Operations", () => {
		let childFolder: IFolder;

		beforeEach(async () => {
			// Create a child folder for structure tests
			childFolder = await Folder.create({
				userId: testUser._id,
				name: "Child Folder",
				parentFolderId: rootFolder._id,
			});
			await Folder.findByIdAndUpdate(rootFolder._id, {
				$push: { childrenFolders: childFolder._id },
			});
		});

		it("POST /folders/move → should move a folder to new parent", async () => {
			const newParent = await Folder.create({
				userId: testUser._id,
				name: "New Parent",
			});

			const res = await request(app)
				.patch("/folders/move")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					id: childFolder.id,
					parentFolderId: newParent.id,
				});

			expect(res.status).toBe(200);
			expect(res.body.parentFolderId).toBe(newParent.id);

			// Verify old parent no longer has this child
			const oldParent = await Folder.findById(rootFolder.id);
			expect(oldParent?.childrenFolders).not.toContainEqual(childFolder.id);

			// Verify new parent has this child
			const updatedNewParent = await Folder.findById(newParent.id);
			expect(updatedNewParent?.childrenFolders).toContainEqual(childFolder._id);
		});

		it("DELETE /folders/:id → should delete a folder and its children", async () => {
			// Create a grandchild folder
			const grandchild = await Folder.create({
				userId: testUser._id,
				name: "Grandchild",
				parentFolderId: childFolder._id,
			});
			await Folder.findByIdAndUpdate(childFolder._id, {
				$push: { childrenFolders: grandchild._id },
			});

			const res = await request(app)
				.delete(`/folders/${childFolder._id}`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.message).toBe(
				"Folder and its contents deleted successfully",
			);

			// Verify all folders were deleted
			const deletedChild = await Folder.findById(childFolder._id);
			expect(deletedChild).toBeNull();

			const deletedGrandchild = await Folder.findById(grandchild._id);
			expect(deletedGrandchild).toBeNull();

			// Verify parent no longer references this folder
			const parent = await Folder.findById(rootFolder._id);
			expect(parent?.childrenFolders).not.toContainEqual(childFolder._id);
		});
	});

	describe("Error Handling", () => {
		it("should return 404 for non-existent folder", async () => {
			const fakeId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.get(`/folders/${fakeId}`)
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(404);
		});

		it("should return 400 for invalid folder ID format", async () => {
			const res = await request(app)
				.get("/folders/invalid-id")
				.set("Authorization", `Bearer ${authToken}`);

			expect(res.status).toBe(400);
		});

		it("should prevent circular folder references", async () => {
			const folder1 = await Folder.create({
				userId: testUser._id,
				name: "Folder 1",
			});
			const folder2 = await Folder.create({
				userId: testUser._id,
				name: "Folder 2",
				parentFolderId: folder1._id,
			});
			// Try to make folder1 a child of folder2 (creating a loop)
			const res = await request(app)
				.patch("/folders/move")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					id: folder1._id,
					parentFolderId: folder2._id,
				});
			expect(res.status).toBe(400);
		});
	});
});
