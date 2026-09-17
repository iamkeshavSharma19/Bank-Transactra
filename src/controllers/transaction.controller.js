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

    const transaction = new TransactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });

    // Pass session when saving the transaction instance
    await transaction.save({ session });

    const creditLedgerEntry = await LedgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    // await (() => {
    //   return new Promise((resolve) => setTimeout(resolve, 100 * 1000));
    // });

    const debitLedgerEntry = await LedgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";

    await transaction.save( { session } );

    await session.commitTransaction();

    session.endSession();

    //?STEP 10 => SENDING TRANSACTION EMAIL NOTIFICATION.
    sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

    res.status(201).json({
      message: "Transaction Completed Successfully",
      transaction: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};

// export const createInitialFundsTransaction = async (req, res) => {
//   try {
//     const { toAccount, amount, idempotencyKey } = req.body;

//     if (!toAccount || !amount || !idempotencyKey) {
//       return res.status(400).json({
//         message: "toAccount, amount and idempotencyKey are required",
//       });
//     }

//     const toUserAccount = await AccountModel.findOne({
//       _id: toAccount,
//     });

//     if (!toUserAccount) {
//       return res.status(400).json({
//         message: "Invalid toAccount",
//       });
//     }

//     const fromUserAccount = await AccountModel.findOne({
//       user: req.user._id,
//     });

//     if (!fromUserAccount) {
//       return res.status(400).json({
//         message: "System user account not found",
//       });
//     }

//     //!CREATING A SESSION FOR INITIATING THE TRANSACTION.

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     const transaction = new TransactionModel({
//       fromAccount: fromUserAccount._id,
//       toAccount,
//       amount,
//       idempotencyKey,
//       status: "PENDING",
//     });

//     await transaction.save({ session });

//     const debitLedgerEntry = await LedgerModel.create(
//       [
//         {
//           account: fromUserAccount._id,
//           amount: amount,
//           transaction: transaction._id,
//           type: "DEBIT",
//         },
//       ],
//       { session },
//     );

//     const creditLedgerEntry = await LedgerModel.create(
//       [
//         {
//           account: toAccount,
//           amount: amount,
//           transaction: transaction._id,
//           type: "CREDIT",
//         },
//       ],
//       { session },
//     );

//     transaction.status = "COMPLETED";
//     await transaction.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(201).json({
//       success: true,
//       message: "Initial funds transaction completed Successfully",
//       transaction: transaction,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({
//       success: false,
//       message: "Something Went Wrong",
//     });
//   }
// };

export const createInitialFundsTransaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "toAccount, amount and idempotencyKey are required",
      });
    }

    const toUserAccount = await AccountModel.findOne({ _id: toAccount });
    if (!toUserAccount) {
      return res.status(400).json({ message: "Invalid toAccount" });
    }

    const fromUserAccount = await AccountModel.findOne({ user: req.user._id });
    if (!fromUserAccount) {
      return res.status(400).json({ message: "System user account not found" });
    }

    // Start Transaction
    session.startTransaction();

    const transaction = new TransactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });

    // Pass session when saving the transaction instance
    await transaction.save({ session });

    await LedgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await LedgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    // Abort transaction on failure
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  } finally {
    // Always end the session
    session.endSession();
  }
};
