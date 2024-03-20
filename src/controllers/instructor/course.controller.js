import mongoose from "mongoose";
import { Instructor } from "../../models/instructorModels/instructor.model.js";
import { AppError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Topic } from "../../models/courseModel/topics.model.js";

const listOfAllCoursesAssignedToInstructor = asyncHandler(
  async (req, res, next) => {
    try {
      const instructor = await Instructor.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.instructor?._id),
          },
        },
        {
          $lookup: {
            from: "courses",
            localField: "assignedCourse",
            foreignField: "_id",
            as: "assignedCourse",
            pipeline: [
              {
                $lookup: {
                  from: "videos",
                  localField: "courseVideos",
                  foreignField: "_id",
                  as: "courseVideos",
                },
              },
              {
                $lookup: {
                  from: "batches",
                  localField: "batch",
                  foreignField: "_id",
                  as: "batch",
                },
              },
            ],
          },
        },
      ]);

      console.log("instructor and courses", instructor);
      //   console.log("intructor1 and courses", intructor1);
      return res
        .status(200)
        .json(new ApiResponse(200, instructor, "Instructor fetched"));
    } catch (error) {
      console.log("Error while fetching instructor", error);
      return next(new AppError("Error while fetching instructor", 500));
    }
  }
);

const createTopics = asyncHandler(async (req, res, next) => {
  try {
    // get course id and array of object with topic name
    const { courseId } = req.params;
    const { topics } = req.body;
    console.log("courseId", courseId);
    console.log("topics", topics);
    if (topics.length <= 0) {
      return next(new AppError("Course topics are required", 400));
    }
    // console.log("thik handle topics", topics);
    const createdTopic = await Topic.create({
      topics: topics,
      course: courseId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, createdTopic, "Topics created successfully"));
  } catch (error) {
    console.log("Error while creating topics", error);
    return next(new AppError("Error while creating topics", 500));
  }
});

const changeTopicStatus = asyncHandler(async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { topics } = req.body;
    const updateTopicStatus = await Topic.findByIdAndUpdate(
      topicId,
      {
        $set: { topics },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, updateTopicStatus, "Topic updated successfully")
      );
  } catch (error) {
    console.log("Error while changing topic status", error);
    return next(new AppError("Error while changing topic status", 500));
  }
});

export {
  listOfAllCoursesAssignedToInstructor,
  createTopics,
  changeTopicStatus,
};
