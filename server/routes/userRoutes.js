import express from "express"
import { auth } from "../middlewares/auth.js";
import { getPublishedCreations, getUsercCreations, toggleLikeCreation } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/get-user-creations', auth, getUsercCreations)
userRouter.get('/get-published-creations', auth, getPublishedCreations)
userRouter.post('/toggle-like-creations', auth, toggleLikeCreation)

export default userRouter;