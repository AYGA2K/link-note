import express from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { errorHandler } from "../src/middlewares/errorHandler";
import User, { type IUser } from "../src/models/user";
import authRouter from "../src/routes/auth";
import { authMiddleware } from "../src/middlewares/auth";

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use("/api/auth", authRouter);
app.use(errorHandler);

// Test database setup
let mongo: MongoMemoryServer;
describe("Auth API (Integration Tests)", () => {
	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		const uri = mongo.getUri();

		await mongoose.connect(uri);
	});

	afterAll(async () => {
		await User.deleteMany({});
		await mongoose.disconnect();
		await mongo.stop();
	});

	describe("Registration", () => {
		it("POST /auth/register → should register a new user", async () => {
			const newUser = {
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				password: "password123",
			};

			const res = await request(app).post("/api/auth/register").send(newUser);

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("user");
			expect(res.body).toHaveProperty("token");
			expect(res.body.user).toMatchObject({
				firstName: newUser.firstName,
				lastName: newUser.lastName,
				email: newUser.email,
			});
			expect(res.body.user.password).toBeUndefined();
		});

		it("POST /auth/register → should reject duplicate email", async () => {
			const userData = {
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				password: "password123",
			};

			// First registration
			await request(app).post("/api/auth/register").send(userData);

			// Second registration with same email
			const res = await request(app).post("/api/auth/register").send(userData);

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Email already in use");
		});

		it("POST /auth/register → should validate input fields", async () => {
			const invalidUser = {
				firstName: "J", // Too short
				lastName: "Doe",
				email: "invalid-email",
				password: "short",
			};

			const res = await request(app)
				.post("/api/auth/register")
				.send(invalidUser);

			expect(res.status).toBe(400);
			expect(res.body.message).toBeDefined();
		});
	});

	describe("Login", () => {
		const testUserData = {
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password: "password123",
		};

		beforeEach(async () => {
			// Create a test user before each login test
			await request(app).post("/api/auth/register").send(testUserData);
		});

		it("POST /auth/login → should login with valid credentials", async () => {
			const res = await request(app).post("/api/auth/login").send({
				email: testUserData.email,
				password: testUserData.password,
			});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("user");
			expect(res.body).toHaveProperty("token");
			expect(res.body.user.email).toBe(testUserData.email);
		});

		it("POST /auth/login → should reject invalid password", async () => {
			const res = await request(app).post("/api/auth/login").send({
				email: testUserData.email,
				password: "wrongpassword",
			});

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Invalid email or password");
		});

		it("POST /auth/login → should reject non-existent email", async () => {
			const res = await request(app).post("/api/auth/login").send({
				email: "nonexistent@example.com",
				password: "password123",
			});

			expect(res.status).toBe(400);
			expect(res.body.error.message).toBe("Invalid email or password");
		});
	});

	describe("Me Endpoint", () => {
		let validToken: string;

		beforeEach(async () => {
			// Register and login to get a valid token
			const userData = {
				firstName: "Test",
				lastName: "User",
				email: "test@example.com",
				password: "password123",
			};

			await request(app).post("/api/auth/register").send(userData);
			const loginRes = await request(app).post("/api/auth/login").send({
				email: userData.email,
				password: userData.password,
			});
			validToken = loginRes.body.token;
		});

		it("GET /auth/me → should return user data with valid token", async () => {
			const res = await request(app)
				.get("/api/auth/me")
				.set("Authorization", `Bearer ${validToken}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("user");
			expect(res.body.user.email).toBe("test@example.com");
		});

		it("GET /auth/me → should reject request without token", async () => {
			const res = await request(app).get("/api/auth/me");

			expect(res.status).toBe(401);
			expect(res.body.error.message).toBe("Missing token");
		});

		it("GET /auth/me → should reject invalid token", async () => {
			const res = await request(app)
				.get("/api/auth/me")
				.set("Authorization", "Bearer invalidtoken");

			expect(res.status).toBe(401);
			expect(res.body.error.message).toBe("Invalid token");
		});
	});
});
