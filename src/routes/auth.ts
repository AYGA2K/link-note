import { Router } from "express";
import { login, me, register } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.get("/me", me);

export default authRouter;
