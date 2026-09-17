import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"],
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Please Provide a valid email Address");
        }
      },
      unique: [true, "Email already exists"],
    },

    name: {
      type: String,
      required: [true, "Name is required for creating a new account"],
    },

    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minLength: [6, "password should contain more than 6 characters"],

      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Please provide a strong Password");
        }
      },
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.methods.validatePassword = async function (password) {
  const user = this;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  return isPasswordValid;
};

export const UserModel = mongoose.model("User", userSchema);
