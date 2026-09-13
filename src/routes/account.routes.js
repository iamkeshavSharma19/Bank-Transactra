import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as accountController from "../controllers/account.controller.js";

const accountRouter = Router();

/**
 * - POST /api/accounts/
 * - Create a new Bank Account
 * - Protected Route
 */
accountRouter.post("/", authMiddleware, accountController.handleCreateAccount);

export default accountRouter;
