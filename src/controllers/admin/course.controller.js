import { Course } from "../../models/courseModel/course.model.js";
import { Batch } from "../../models/courseModel/courseBatch.model.js";
import { TimeTable } from "../../models/courseModel/timeTable.model.js";
import { AppError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary.js";
import { generateUniqueId } from "../../utils/generateUniqueId.js";

// import moment from "moment/moment";
import moment from "moment/moment.js";

const createCourse = asyncHandler(async (req, res, next) => {
  try {
    const {
      courseTitle,
      duration,
      coursePrice,
      discount,
      description,
      batchName,
      max_student,
      date,
      startTime,
      endTime,
      note,
      faqs,
    } = req.body;
    const syllabus = req.file;

    console.log("file syllabus", syllabus);

    if (
      [courseTitle, duration, description, batchName, note].some(
        (field) => field?.trim() === ""
      )
    ) {
      return next(new AppError("All fields are required", 400));
    }
    if (!syllabus) {
      return next(new AppError("Syllabus file is required", 400));
    }

    const syllabus_file_path = await uploadOnCloudinary(syllabus.path);

    if (!syllabus_file_path) {
      return next(
        new AppError("Syllabus file is unable to upload on cloud", 400)
      );
    }

    const batchId = generateUniqueId();

    const timeTable = await TimeTable.create({
      date: date || moment(new Date()).format("DD/MM/YYYY"),
      startTime: startTime || moment(new Date()).format("HH:mm"),
      endTime: endTime || moment(new Date()).format("HH:mm"),
    });
    // console.log("moment", moment("DD-MM-YYYY"));
    const batch = await Batch.create({
      batchName,
      max_student,
      batchId: batchId,
      time_table: timeTable._id,
    });

    const course = await Course.create({
      courseTitle,
      duration,
      coursePrice,
      discount,
      description,
      note,
      faqs,
      batch: batch._id,
      syllabus: syllabus_file_path?.url,
      syllabusPublicId: syllabus_file_path.public_id,
    });

    if (!timeTable || !batch || !course) {
      return next(new AppError("Error while creating course", 400));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { course, batch, timeTable },
          "Course created successfully"
        )
      );

    // batch need
  } catch (error) {
    console.log("Error while creating course", error);
  }
});

const getAllCourses = asyncHandler(async (req, res, next) => {
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

const blockCourse = asyncHandler(async (req, res, next) => {
  try {
    const id = req.query.id;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: { isBlocked: true },
      },
      { new: true }
    );

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { course }, "Course blocked successfully"));
  } catch (error) {
    console.log("Error while trying to block and unblock course", error);
  }
});
const unblockCourse = asyncHandler(async (req, res, next) => {
  try {
    const id = req.query.id;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: { isBlocked: false },
      },
      { new: true }
    );

    if (!course) {
      return next(new AppError("course not found", 404));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { course }, "Course unblocked successfully"));
  } catch (error) {
    console.log("Error while trying to block and unblock course", error);
  }
});

const updateCourseTiming = asyncHandler(async (req, res, next) => {
  try {
    const { courseTimingId } = req.query;
    const { date, startTime, endTime } = req.body;
    console.log("CourseTimingId: " + courseTimingId);
    const timeTable = await TimeTable.findByIdAndUpdate(
      { _id: courseTimingId },
      {
        $set: { date, startTime, endTime },
      },
      { new: true }
    );
    console.log("timeTable", timeTable);
    return res
      .status(200)
      .json(
        new ApiResponse(200, timeTable, "CourseTiming updated successfully")
      );
  } catch (error) {
    console.log("Error while trying to update course timing", error);
  }
});

const deleteCourse = asyncHandler(async (req, res, next) => {
  try {
    const { courseId } = req.query;
    console.log("courseId", courseId);
    const course = await Course.findById(courseId);
    console.log("course to delete", course);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    if (course?.Student?.length > 0) {
      return next(
        new AppError(
          "This course can not be deleted because this course is purchased by the students",
          400
        )
      );
    }
    if (course.isInstructorAssigned) {
      return next(
        new AppError("Deallocate instructor to delete this course", 400)
      );
    }

    const deletedCourse = await Course.findByIdAndDelete(courseId);
    console.log("deletedCourse", deletedCourse);

    if (deletedCourse.syllabusPublicId) {
      // return next(new AppError("Course cloud id not found", 404));
      const { result } = await deleteFromCloudinary(
        deletedCourse.syllabusPublicId
      );
      console.log("Deleted", result);
    }

    // console.log("instructor id: " + instructor);

    const batch = await Batch.findByIdAndDelete(deletedCourse?._id);
    const timeTable = await TimeTable.findByIdAndDelete(batch?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deleteCourse, batch, timeTable },
          "Course deleted successfully"
        )
      );
  } catch (error) {
    console.log("Error while trying to delete course", error);
  }
});

export {
  createCourse,
  getAllCourses,
  unblockCourse,
  blockCourse,
  updateCourseTiming,
  deleteCourse,
};
// const deleteInstructor = asyncHandler(async (req, res, next) => {
//     try {
//       const id = req.query.id;
//       const deletedInstructor = await Instructor.findByIdAndDelete(id);
//       console.log("deleted instructor", deletedInstructor);
//       if (!deletedInstructor) {
//         return next(new AppError("Instructor not found", 404));
//       }

//       if (deletedInstructor.profilePhotoPublicId) {
//         const { result } = await deleteFromCloudinary(
//           deletedInstructor.profilePhotoPublicId
//         );
//         console.log("image updated successfully", result);
//       }

//       return res
//         .status(200)
//         .json(new ApiResponse(200, {}, "Instructors deleted successfully"));
//     } catch (error) {
//       console.log("Error while deleting Instructor", error);
//     }
//   });
