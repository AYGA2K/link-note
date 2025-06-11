import mongoose, { Mongoose, MongooseError } from 'mongoose';
import User, { IUser } from '../src/models/user';

describe('User Model', () => {
  beforeAll(async () => {
    const URI = process.env.TEST_DB_URI;
    if (!URI) {
      throw new Error('❌ MongoDB connection error: TEST_DB_URI not set');
    }
    await mongoose.connect(URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a new user with valid fields', async () => {
      const userData: Partial<IUser> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should fail if firstName is missing', async () => {
      const userData = {
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail if firstName is less than 3 characters', async () => {
      const userData = {
        firstName: 'Jo',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail if firstName is more than 30 characters', async () => {
      const userData = {
        firstName: 'J'.repeat(31),
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail if email is invalid', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail if password is less than 8 characters', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'pass',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail if email is not unique', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password456',
      };

      await User.create(userData1);
      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow(mongoose.mongo.MongoError);
    });
  });

  describe('Password Hashing', () => {
    it('should hash the password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(0);
    });

    it('should not rehash the password if not modified', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const originalHash = user.password;

      user.firstName = 'Johnny';
      await user.save();
      expect(user.password).toBe(originalHash);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });
});
