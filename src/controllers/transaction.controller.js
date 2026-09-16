import { sendTransactionEmail } from "../config/verify-mail.js";
import { LedgerModel } from "../models/ledger.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { AccountModel } from "../models/account.model.js";
import mongoose from "mongoose";

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

    //!STEP1 => VALIDATE REQUEST

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        message:
          "fromAccount, toAccount, amount and idempotency key are required",
      });
    }

    const fromUserAccount = await AccountModel.findOne({
      _id: fromAccount,
    });

    const toUserAccount = await AccountModel.findOne({
      _id: toAccount,
    });

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid fromAccount or toAccount",
      });
    }

    //! STEP2 => VALIDATE IDEMPOTENCY KEY.

    const isTransactionAlreadyExists = await TransactionModel.findOne({
      idempotencyKey: idempotencyKey,
    });

    if (isTransactionAlreadyExists) {
      if (isTransactionAlreadyExists.status === "COMPLETED") {
        return res.status(200).json({
          message: "Transaction already exists",
          transaction: isTransactionAlreadyExists,
        });
      }
      if (isTransactionAlreadyExists.status === "PENDING") {
        return res.status(200).json({
          message: "Transaction is still processing",
        });
      }

      if (isTransactionAlreadyExists.status === "FAILED") {
        return res.status(500).json({
          message: "Transaction processing failed, please retry",
        });
      }

      if (isTransactionAlreadyExists.status === "REVERSED") {
        return res.status(500).json({
          message: "Transaction was reversed, Please retry",
        });
      }
    }

    //!STEP3 => CHECK ACCOUNT STATUS

    if (
      fromUserAccount.status !== "ACTIVE" ||
      toUserAccount.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        message:
          "Both fromAccount and toAccount must be active to process the transaction",
      });
    }

    //!STEP4 => DERIVE SENDER BALANCE FROM THE LEDGER

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
      });
    }

    //!STEP5 => CREATE TRANSACTION PENDING

    //~CREATING SESSION IN MONGOOSE
    const session = await mongoose.startSession();

    session.startTransaction();

    const transaction = await TransactionModel.create(
      {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",
      },
      { session },
    );

    const creditLedgerEntry = await LedgerModel.create(
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
      { session },
    );

    const debitLedgerEntry = await LedgerModel.create(
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
      { session },
    );

    transaction.status = "COMPLETED";

    await transaction.save();

    await session.commitTransaction();

    session.endSession();

    

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
