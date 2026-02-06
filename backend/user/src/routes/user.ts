import express, { Router } from "express";
import {
  getAllUsers,
  getAUser,
  loginUser,
  myProfile,
  updateName,
  verifyUSer,
} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUSer);
router.get("/me", isAuth, myProfile);
router.get("/user/all", isAuth, getAllUsers),
  router.get("/user/:id", isAuth, getAUser),
  router.post("/update/user", isAuth, updateName);

export default router;
