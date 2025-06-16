import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors";
import User from "../models/user";
import type { IUser } from "../models/user";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "default_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? "7d";

const generateToken = (userId: string): string => {
	return jwt.sign({ id: userId }, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	} as jwt.SignOptions);
};

export async function register(req: Request, res: Response) {
	const { firstName, lastName, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new BadRequestError("Email already in use");
	}

	const newUser = await new User({
		firstName,
		lastName,
		email,
		password,
	}).save();

	const token = generateToken(newUser.id.toString());

	res.status(201).json({
		user: {
			id: newUser.id.toString(),
			firstName: newUser.firstName,
			lastName: newUser.lastName,
			email: newUser.email,
		},
		token,
	});
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		throw new BadRequestError("Invalid email or password");
	}

	const isMatch = await user.comparePassword(password);
	if (!isMatch) {
		throw new BadRequestError("Invalid email or password");
	}

	const token = generateToken(user.id.toString());

	res.status(200).json({
		user: {
			id: user.id.toString(),
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		},
		token,
	});
}

export async function me(req: Request, res: Response) {
	if (!req.headers.authorization) {
		throw new UnauthorizedError("Missing token");
	}

	const token = req.headers.authorization.split(" ")[1];
	const decoded = jwt.verify(token, JWT_SECRET) as IUser;

	if (!decoded) {
		throw new BadRequestError("Invalid token");
	}

	const user = await User.findById(decoded.id);
	if (!user) {
		throw new NotFoundError("User not found");
	}

	res.status(200).json({
		user: {
			id: user.id.toString(),
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
		},
	});
}
