import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

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

export default transactionRouter;
