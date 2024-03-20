import { Course } from "../../models/courseModel/course.model.js";
import { AppError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const listOfAllCourses = asyncHandler(async (req, res, next) => {
  try {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    let count = await Course.countDocuments();

    console.log(count);
    const allCourses = await Course.find()
      .populate({
        path: "batch",
        populate: "time_table",
      })
      .populate({
        path: "assignedInstructor",
        select: "-assignedCourse -createdVideos",
      })
      //   .select("-assignedCourse -createdVideos")
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip);
    console.log("allCourses", allCourses);
    return res
      .status(200)
      .json(new ApiResponse(200, { allCourses, count }, "All courses"));
  } catch (error) {
    console.log("Error while getting all courses", error);
  }
});

export { listOfAllCourses };
