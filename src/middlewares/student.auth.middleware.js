import jwt from "jsonwebtoken";
import { AppError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Student } from "../models/studentModels/student.model.js";

const studentVerifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // console.log("student jwt token: ", req);
    if (!token) {
      return next(new AppError("Unauthorized request", 401));
    }
    console.log("student jwt token: ", token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("decoded token: " + decodedToken);
    const student = await Student.findById(decodedToken._id);

    console.log("logged in student: " + student);
    if (!student) {
      return next(new AppError("Invalid access token", 401));
    }
    req.student = student;
    next();
  } catch (error) {
    console.log("Student jwt verification failed", error);
    return next(new AppError("Unauthorized access token", 401));
  }
});

export { studentVerifyJWT };
