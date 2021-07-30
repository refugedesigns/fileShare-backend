import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression"

import { v2 as cloudinary } from "cloudinary";

import fileRouter from "./router/file-router.js";
import connectDB from "./helpers/db.js";

const app = express();

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(compression())

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/api/files", fileRouter);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

await connectDB();

app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
