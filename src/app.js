import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import { connectDB } from "./config/database.js";
import authRouter from "./routes/auth.routes.js";
import accountRouter from "./routes/account.routes.js";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 7777;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);

connectDB()
  .then(() => {
    console.log("Database Connection established Successfully");
    app.listen(PORT, (err) => {
      if (err) console.log(err);
      console.log(`App is successfully listening on the port ${PORT}`);
    });
  })
  .catch(() => {
    console.log("Database cannot be established");
  });
