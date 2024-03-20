import { User } from "../models/user.model.js";
import { AppError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new AppError("Unauthorized request", 401));
    }
    console.log("tokem", token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("decodedToken", decodedToken);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    console.log("find logged in user ", user);

    if (!user) {
      // discuss about frontend

      return next(new AppError("Invalid access token", 401));
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    // throw new ApiError(401, error?.message || "Unauthorized access token");
    return next(new AppError("Unauthorized access token", 401));
  }
});

export { verifyJWT };
