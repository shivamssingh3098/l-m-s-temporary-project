import mongoose, { Schema } from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
const instructorSchema = Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      validate: [validator.isEmail],
      required: [true, "Instructor email required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: [true, "Instructor phone number required"],
      trim: true,
      index: true,
      unique: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    profilePhotoPublicId: {
      type: String,
      default: "",
    },
    qualification: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },
    completeAddress: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    assignedCourse: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    createdVideos: [{ type: Schema.Types.ObjectId, ref: "Video" }],

    // password: {
    //   type: String,
    //   required: [true, "Password is required"],
    // },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

instructorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      mobile: this.mobile,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const Instructor = mongoose.model("Instructor", instructorSchema);
