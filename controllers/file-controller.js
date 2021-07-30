import { v2 as cloudinary } from "cloudinary";
import File from "../models/file.js";
import mongoose from "mongoose";
import https from "https";
import nodemailer from "nodemailer";
import emailTemplate from "../utils/email-template.js";

export const postUpload = async (req, res, next) => {
  if (!req.file) {
    const error = new Error("Hey bro! We need the file!");
    error.statusCode = 422;
    throw error;
  }

  let uploadedFile;

  try {
    uploadedFile = await cloudinary.uploader.upload(req.file.path, {
      folder: "fileShare",
      resource_type: "auto",
    });
  } catch (err) {
    const error = new Error("File upload failed!");
    error.statusCode = 500;
    next(error);
  }

  const { originalname } = req.file;
  const { secure_url, bytes, format } = uploadedFile;

  const file = new File({
    filename: originalname,
    sizeInBytes: bytes,
    secure_url,
    format,
  });

  const savedFile = await file.save();

  res.status(201).json({
    message: "file uploaded successfully :)",
    id: savedFile._id,
    downloadLink: `${
      process.env.API_BASE_ENDPOINT_CLIENT
    }/download/${savedFile._id.toString()}`,
  });
};

export const getFile = async (req, res, next) => {
  const id = req.params.id;

  let file;
  try {
    file = await File.findById({ _id: mongoose.Types.ObjectId(id) });

    console.log(file);
    if (!file) {
      const error = new Error("No file found!");
      error.statusCode = 422;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = "Server Error!";
      next(err);
    }
  }

  console.log(file);
  const { filename, format, sizeInBytes } = file;

  res.status(200).json({
    filename,
    format,
    sizeInBytes,
    id: file._id.toString(),
  });
};

export const getDownload = async (req, res, next) => {
  const id = req.params.id;

  let file;
  try {
    file = await File.findById({ _id: mongoose.Types.ObjectId(id) });

    console.log(file);
    if (!file) {
      const error = new Error("No file found!");
      error.statusCode = 422;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = "Server Error!";
      next(err);
    }
  }

  https.get(file.secure_url, (fileStream) => fileStream.pipe(res));
};

export const postLink = async (req, res, next) => {
  const { id, emailFrom, emailTo } = req.body;

  let file;
  try {
    file = await File.findById({ _id: mongoose.Types.ObjectId(id) });

    console.log(file);
    if (!file) {
      const error = new Error("No file found!");
      error.statusCode = 422;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = "Server Error!";
      next(err);
    }
  }

  let transporter = nodemailer.createTransport({
    host: process.env.MAILJET_SMTP_HOST,
    port: process.env.MAILJET_SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILJET_SMTP_USER, // generated ethereal user
      pass: process.env.MAILJET_SMTP_PASSWORD, // generated ethereal password
    },
  });

  const { filename, sizeInBytes } = file;

  const fileSize = `${(+sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  const downloadLink = `${
    process.env.API_BASE_ENDPOINT_CLIENT
  }/download/${file._id.toString()}`;

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: "File shared with you",
    text: `${emailFrom} shared a file with you`,
    html: emailTemplate(emailFrom, fileSize, downloadLink, filename),
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error!" });
  }
  console.log(info);

  file.sender = emailFrom;
  file.receiver = emailTo;

  await file.save();

  return res.status(200).json({ message: "Email sent successfully" });
};
