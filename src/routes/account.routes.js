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

/**
 * - GET /api/accounts/
 * - GET all the accounts of the loggedIn User
 * - Protected Route
 */
accountRouter.get(
  "/",
  authMiddleware,
  accountController.getUserAccountsController,
);

/**
 * - GET /api/accounts/balance:accountId
 *
 */
accountRouter.get(
  "/balance/:accountId",
  authMiddleware,
  accountController.getAccountBalanceController,
);

export default accountRouter;
