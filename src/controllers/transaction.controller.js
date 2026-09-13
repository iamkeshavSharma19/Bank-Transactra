import { sendTransactionEmail } from "../config/verify-mail.js";
import { LedgerModel } from "../models/ledger.model.js";
import { TransactionModel } from "../models/transaction.model.js";


/**
 * - Create a new transaction
 * - THE 10-STEP TRANSFER FLOW
 * 1.Validate request
 * 2.Validate idempotency key
 * 3.Check account status
 * 4.Derive sender balance from ledger
 * 5.Create transaction (PENDING)
 * 6.Create DEBIT ledger entry
 * 7.Create CREDIT ledger entry
 * 8.Mark transaction COMPLETED
 * 9.Commit MongoDB session
 * 10. Send Email notification
 */
export const handleCreateTransaction = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
