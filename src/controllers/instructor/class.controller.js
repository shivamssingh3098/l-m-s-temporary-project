import { Course } from "../../models/courseModel/course.model.js";
import { Instructor } from "../../models/instructorModels/instructor.model.js";
import { StudyMaterial } from "../../models/videoModels/studyMaterial.model.js";
import { Video } from "../../models/videoModels/video.model.js";
import { AppError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary.js";

const createClass = asyncHandler(async (req, res, next) => {
  try {
    const { title, description, courseId } = req.body;
    const thumbnail = req.file;
    // const videoUrl = req.file;
    console.log("thumbnail", thumbnail);
    console.log("title, description, course", title, description, courseId);

    if ([title, description, courseId].some((field) => field?.trim() === "")) {
      return next(new AppError("All fields are required", 404));
    }
    if (!thumbnail) {
      return next(new AppError("Thumbnail image is required", 404));
    }
    const course = await Course.findById(courseId).select(
      "isInstructorAssigned assignedInstructor courseVideos"
    );
    console.log("course", course);
    if (!course.isInstructorAssigned) {
      console.log("course.isInstructorAssigned", course.isInstructorAssigned);
      return next(
        new AppError("Not any instructor assign to this course ", 404)
      );
    }

    const cloudinaryUrl = await uploadOnCloudinary(thumbnail.path);

    console.log("cloudinaryUrl", cloudinaryUrl);
    if (!cloudinaryUrl.url) {
      return next(
        new AppError("Error while uploading Thumbnail Photo to cloudinary", 400)
      );
    }

    console.log("thumbnailImage", cloudinaryUrl);

    const classVideo = await Video.create({
      title,
      description,
      thumbnail: cloudinaryUrl.url,
      thumbnailPublicId: cloudinaryUrl.public_id,
      course: courseId,
      createdBy: course.assignedInstructor,
    });

    console.log("id is---", course.courseVideos);
    course.courseVideos.push(classVideo._id);

    await course.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, classVideo, "Class uploaded successfully"));
  } catch (error) {
    console.log("Error while creating video", error);
  }
});

const uploadVideoOfClass = asyncHandler(async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classData = await Video.findById(classId);
    console.log(classData);
    if (!classData) {
      return next(new AppError("This class not available", 404));
    }

    if (classData.videoPublicId) {
      const { result } = await deleteVideoFromCloudinary(
        classData.videoPublicId
      );
      console.log("Video updated successfully", result);
    }

    const coudinaryUrl = await uploadOnCloudinary(req.file.path);
    console.log("coudinaryUrl", coudinaryUrl);
    if (!coudinaryUrl) {
      return next(new AppError("Error while uploading video", 404));
    }

    classData.videoUrl = coudinaryUrl.url;
    classData.videoPublicId = coudinaryUrl.public_id;

    classData.duration = coudinaryUrl.duration;

    const instructor = await Instructor.findByIdAndUpdate(
      req.instructor?._id,
      { $addToSet: { createdVideos: classData._id } },
      { new: true }
    );
    console.log("instructor updated video", instructor);
    await classData.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, classData, "Video saved successfully"));
  } catch (error) {
    console.log("Error while uploading video", error);
    return next(new AppError("Error while uploading video", 500));
  }
});

const createStudyMaterial = asyncHandler(async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { note, description, referenceLink } = req.body;
    console.log(
      "note, description, referenceLink",
      note,
      description,
      referenceLink
    );
    let obj = [
      {
        title: "No title available",
        link: "No link available",
      },
      {
        title: "No title available",
        link: "No link available",
      },
    ];
    let isAvailableReferenceLink = referenceLink ? referenceLink : obj;

    // console.log("Creating studyMaterial classId", req);
    // console.log("req.file.path", req.file.path);
    const classData = await Video.findById(classId);
    if (!classData) {
      return next(new AppError("This class is not found", 404));
    }
    let cloudinaryUrl;
    if (req.file?.path) {
      cloudinaryUrl = await uploadOnCloudinary(req.file?.path);
      console.log("cloudinaryUrl", cloudinaryUrl);
    }

    const studyMaterial = await StudyMaterial.create({
      note,
      description,
      pdf: cloudinaryUrl?.url || "",
      pdfPublicId: cloudinaryUrl?.public_id || "",
      video: classData?._id,
      referenceLink: isAvailableReferenceLink,
    });
    console.log("studyMaterial", studyMaterial);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          studyMaterial,
          "Study material created successfully"
        )
      );
  } catch (error) {
    console.log("Error while creating study material", error);
    return next(new AppError("Error while creating study material", 500));
  }
});

const publishClass = asyncHandler(async (req, res, next) => {
  try {
    const { classId } = req.params;
    const classData = await Video.findByIdAndUpdate(
      classId,
      {
        $set: {
          isPublished: true,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, classData, "Class successfully published"));
  } catch (error) {
    console.log("Error while publishing class", error);
  }
});

const unpublishClass = asyncHandler(async (req, res, next) => {
  try {
    const { classId } = req.params;
    const classData = await Video.findByIdAndUpdate(
      classId,
      {
        $set: {
          isPublished: false,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, classData, "Class successfully unpublished"));
  } catch (error) {
    console.log("Error while publishing class", error);
  }
});

const deleteClass = asyncHandler(async (req, res, next) => {
  try {
    const { classId } = req.params;
    console.log("classId for delete class", classId);
    // find course by id and remove video id from this model
    // find instructor by id and remove video id from this model
    // delete video by id
    // find study material by id , id will be available in video model and remove video id from this model
  } catch (error) {
    console.log("Error while deleting class", error);
    return next(new AppError("Error while deleting class", 500));
  }
});

export {
  createClass,
  uploadVideoOfClass,
  createStudyMaterial,
  publishClass,
  unpublishClass,
};
