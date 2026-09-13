import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";

const transactionRouter = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRouter.post("/", transactionController.handleCreateTransaction);

export default transactionRouter;
