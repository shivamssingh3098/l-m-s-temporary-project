import { Student } from "../../models/studentModels/student.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { verifyFirebaseToken } from "../../config/firebase.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary.js";
import { generateUniqueId } from "../../utils/generateUniqueId.js";

const studentRegistration = asyncHandler(async (req, res, next) => {
  try {
    const { fullName, email, mobile, gender, standard, city } = req.body;
    console.log(
      "Student registration",
      fullName,
      email,
      mobile,
      gender,
      standard,
      city
    );

    if (
      [fullName, email, mobile, gender, standard, city].some(
        (field) => field?.trim() === ""
      )
    ) {
      console.log("tested successfully");
      return next(new AppError("All Fields are required", 404));
    }

    const existedStudent = await Student.findOne({
      $or: [{ email }, { mobile }],
    });
    if (existedStudent) {
      return next(
        new AppError("This email or mobile number already exists", 404)
      );
    }

    const studentId = generateUniqueId();

    const student = await Student.create({
      fullName,
      email,
      mobile,
      gender,
      standard,
      city,
      studentId: studentId,
    });

    console.log("student registered successfully", student);
    res
      .status(200)
      .json(new ApiResponse(200, student, "Student registered successfully"));
  } catch (error) {
    console.log("Student registration Error", error);
  }
});
const generateAccessToken = async (userId) => {
  try {
    const user = await Student.findById(userId);
    const accessToken = await user.generateAccessToken();

    user.save({ validateBeforeSave: true });

    return { accessToken };
  } catch (error) {
    console.log(error);
  }
};
const studentLogin = asyncHandler(async (req, res, next) => {
  try {
    const { authToken } = req.body;
    const tokenValue = await verifyFirebaseToken(authToken);
    console.log("Student login", tokenValue);
    console.log("access token", tokenValue.message);

    if (tokenValue.message) {
      return next(new AppError("Unauthorized access token"));
    }

    if (tokenValue.firebase.sign_in_provider === "phone") {
      console.log(
        "tokenValue.phone_number.slice(3)",
        tokenValue.phone_number.slice(3)
      );
      const student = await Student.findOne({
        mobile: tokenValue.phone_number.slice(3),
      });
      console.log("current student", student);
      if (!student) {
        return next(new AppError("Student not found ", 404));
      }
      const { accessToken } = await generateAccessToken(student._id);

      const options = {
        httpOnly: true,
        secure: true,
      };

      console.log("accessToken student", accessToken);
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, student, "Student logged in successfully"));
    }
  } catch (error) {
    console.log("Error occurred while login", error);
  }
});

const studentLogout = asyncHandler(async (req, res, next) => {
  try {
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    console.log("error occurred while logging out", error);
  }
});

const studentUpdateProfile = asyncHandler(async (req, res, next) => {
  try {
    const { standard, city, fatherName, spouse, completeAddress } = req.body;
    console.log(
      "Update student profile",
      standard,
      city,
      fatherName,
      spouse,
      completeAddress
    );

    if (!standard || !city || !fatherName || !spouse || !completeAddress) {
      return next(new AppError("All fields are required"));
    }
    const student = await Student.findByIdAndUpdate(
      req.student?._id,
      { $set: { standard, city, fatherName, spouse, completeAddress } },
      { new: true }
    );
    console.log("Student updated", student);
    res
      .status(200)
      .json(
        new ApiResponse(200, student, "Account details updated successfully")
      );
  } catch (error) {
    console.log("student update profile error", error);
  }
});

const updateProfilePhoto = asyncHandler(async (req, res, next) => {
  try {
    console.log("student", req.file.path);

    const profilePhoto = req.file.path;
    if (!profilePhoto) {
      return next(new AppError("Profile photo is required", 400));
    }

    const student = await Student.findById(req.student?._id);

    if (student.profilePhotoPublicId) {
      const { result } = await deleteFromCloudinary(
        student.profilePhotoPublicId
      );
      console.log("image updated successfully", result);
    }

    const cloudinaryUrl = await uploadOnCloudinary(profilePhoto);
    console.log("cloudinaryUrl", cloudinaryUrl);
    if (!cloudinaryUrl.url) {
      return next(
        new AppError("Error while uploading profile Photo to cloudinary", 400)
      );
    }
    const updatedStudent = await Student.findByIdAndUpdate(
      req.student?._id,
      {
        $set: {
          profilePhoto: cloudinaryUrl.url,
          profilePhotoPublicId: cloudinaryUrl.public_id,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedStudent,
          "Profile photo updated successfully"
        )
      );
  } catch (error) {
    console.log("profile photo update profile error", error);
  }
});

const deleteProfilePhoto = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.student?._id);
  console.log("cludinary id issss", student);

  if (!student.profilePhotoPublicId) {
    return next(new AppError("Profile Photo not available", 404));
  }

  const { result } = await deleteFromCloudinary(student.profilePhotoPublicId);
  // console.log("student id: " + student);
  console.log("Deleted", result);

  if (result === "ok") {
    student.profilePhoto = "";
    student.profilePhotoPublicId = "";

    await student.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Profile photo deleted successfully"));
  } else {
    return next(new AppError("Error while deleting profile Photo", 400));
  }
});

export {
  studentRegistration,
  studentLogin,
  studentLogout,
  studentUpdateProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
};
