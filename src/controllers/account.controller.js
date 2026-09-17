import { AccountModel } from "../models/account.model.js";

export const handleCreateAccount = async (req, res) => {
  try {
    const user = req.user;

    const account = new AccountModel({
      user: user._id,
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: "User's Bank Account Created Successfully",
      account,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};

export const getUserAccountsController = async (req, res) => {
  try {
    const accounts = await AccountModel.find({
      user: req.user._id,
    });

    res.status(200).json({
      message: "All the Accounts of the LoggedIn User are fetched Successfully",
      accounts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};

export const getAccountBalanceController = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await AccountModel.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account Not Found",
      });
    }

    const balance = await account.getBalance();

    res.status(200).json({
      accountId: account._id,
      balance: balance,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
