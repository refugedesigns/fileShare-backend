import express from "express";
import multer from "multer";

import {
  postUpload,
  getFile,
  getDownload,
  postLink
} from "../controllers/file-controller.js";

const router = express.Router();

const storage = multer.diskStorage({});

const upload = multer({
  storage,
});

router.post("/upload", upload.single("myFile"), postUpload);

router.get("/:id", getFile);

router.get("/download/:id", getDownload);

router.post("/email", postLink)

export default router;
