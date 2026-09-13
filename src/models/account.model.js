import mongoose from "mongoose";

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

export const AccountModel = mongoose.model("Account", accountSchema);
