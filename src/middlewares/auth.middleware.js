import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";


export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised access, token is missing",
      });
    }

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decodedObj.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
