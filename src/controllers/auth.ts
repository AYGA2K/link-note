import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { IUser } from '../models/user';

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'default_secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use.' });
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
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
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
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Missing token.' });
    }
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as IUser;

    if (!decoded) {
      return res.status(400).json({ message: 'Invalid token.' });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token.' });
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
    res.status(500).json({ message: 'Server error', error: err });
  }
};

