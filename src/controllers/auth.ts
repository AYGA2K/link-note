import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
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
	try {
		const { firstName, lastName, email, password } = req.body;
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(400).json({ message: "Email already in use." });
			return;
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
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err });
	}
}

export async function login(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			res.status(400).json({ message: "Invalid email or password." });
			return;
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			res.status(400).json({ message: "Invalid email or password." });
			return;
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
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err });
	}
}

export async function logout(req: Request, res: Response) {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			res.status(400).json({ message: "Invalid email or password." });
			return;
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			res.status(400).json({ message: "Invalid email or password." });
			return;
		}

		res.status(200).json({ message: "Logged out successfully." });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err });
	}
}

export async function me(req: Request, res: Response) {
	try {
		if (!req.headers.authorization) {
			res.status(401).json({ message: "Missing token." });
			return;
		}
		const token = req.headers.authorization.split(" ")[1];
		const decoded = jwt.verify(token, JWT_SECRET) as IUser;

		if (!decoded) {
			res.status(400).json({ message: "Invalid token." });
			return;
		}
		const user = await User.findById(decoded.id);
		if (!user) {
			res.status(400).json({ message: "Invalid token." });
			return;
		}

		res.status(200).json({
			user: {
				id: user.id.toString(),
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
			},
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err });
	}
}
