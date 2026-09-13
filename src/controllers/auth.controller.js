import { UserModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/verify-mail.js";

/**
 * - user register controller
 * - POST /api/auth/register
 */

export const handleRegisterUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Either email, name or password is missing",
      });
    }

    const isAlreadyRegistered = await UserModel.findOne({ email: email });

    if (isAlreadyRegistered) {
      return res.status(422).json({
        success: false,
        message: "User already exists with email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      email,
      name,
      password: hashedPassword,
    });

    //?Creating the JSON Web Token
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      },
    );

    await user.save();

    //?Embedding the jwt token inside the cookie
    //?Expiring the cookie in 8 hours.
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });

    //~Sending Welcome Email
    //~FUNCTION CALL
    sendEmail(email);

    res.status(201).json({
      success: "true",
      message: "User Registered Successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
export const handleLoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "EmailId or password is missing",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is INVALID",
      });
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email or password is INVALID",
      });
    }

    //?Creating a JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      },
    );

    //?Embedding the jwt Token inside the cookie
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res.status(200).json({
      success: true,
      message: "User LoggedIn Successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
