import mongoose, { Schema } from "mongoose";
const courseSchema = new Schema(
  {
    courseTitle: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    syllabus: {
      type: String, // pdf file
      // required: true,
    },
    syllabusPublicId: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isInstructorAssigned: {
      type: Boolean,
      default: false,
    },
    assignedInstructor: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
    },
    //new added
    note: {
      type: String,
      default: "",
      trim: true,
    },

    faqs: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
      },
    ],
    //new added
    courseVideos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    coursePurchasedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    // upcomingClasses: [{ type: Schema.Types.ObjectId, ref: "UpcomingClass" }],
    coursePrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
