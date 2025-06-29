import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors";
import User, { type IUser } from "../models/user";
import jwt from "jsonwebtoken";
const JWT_SECRET: string = process.env.JWT_SECRET ?? "default_secret";

export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// skip authentication for health check
	if (req.path === "/api/health") {
		next();
		return;
	}
	// skip authentication for register and login
	if (req.path === "/api/auth/register" || req.path === "/api/auth/login") {
		next();
		return;
	}
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		throw new UnauthorizedError("Missing token");
	}
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as IUser;
		if (!decoded) {
			throw new UnauthorizedError("Invalid token");
		}
		const user = await User.findById(decoded.id);
		if (!user) {
			throw new UnauthorizedError("User not found");
		}
	} catch (error) {

		throw new UnauthorizedError("Invalid token");
  }


	next();
}
