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
