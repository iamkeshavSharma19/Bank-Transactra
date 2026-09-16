import mongoose from "mongoose";
import { LedgerModel } from "../models/ledger.model.js";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Account must be associated with a user"],
      ref: "User",
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: `{VALUE} can be either ACTIVE, FROZEN or CLOSED`,
      },
      default: "ACTIVE",
    },

    currency: {
      type: String,
      required: [true, "Currency is required for creating a account"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  },
);

//?Compound Index
accountSchema.index({ user: 1, status: 1 });

//?Aggregation PipeLine In MongoDB

accountSchema.methods.getBalance = async function () {
  const balanceData = await LedgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]);

  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].balance;
};

export const AccountModel = mongoose.model("Account", accountSchema);
