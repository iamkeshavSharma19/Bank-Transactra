import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authSystemUserMiddleware } from "../middlewares/auth.middleware.js";

const transactionRouter = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRouter.post(
  "/",
  authMiddleware,
  transactionController.handleCreateTransaction,
);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRouter.post(
  "/system/initial-funds",
  authSystemUserMiddleware,
  transactionController.createInitialFundsTransaction,
);

export default transactionRouter;
