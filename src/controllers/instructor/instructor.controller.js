import { verifyFirebaseToken } from "../../config/firebase.js";
import { Instructor } from "../../models/instructorModels/instructor.model.js";
import { AppError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../../utils/cloudinary.js";

const instructorRegistration = asyncHandler(async (req, res, next) => {
  try {
    const { fullName, email, mobile, gender, qualification, city } = req.body;
    if (
      [fullName, email, mobile, gender, qualification, city].some(
        (field) => field?.trim() === ""
      )
    ) {
      return next(new AppError("All Fields are required", 404));
    }

    const existedInstructor = await Instructor.findOne({
      $or: [{ mobile }, { email }],
    });

    console.log(fullName, email, mobile, gender, qualification, city);
    if (existedInstructor) {
      return next(new AppError("Instructor already existed", 404));
    }

    const instructor = await Instructor.create({
      fullName,
      email,
      mobile,
      gender,
      qualification,
      city,
    });

    console.log("Instructor registered successfully", instructor);
    res
      .status(200)
      .json(
        new ApiResponse(200, instructor, "Instructor registered successfully")
      );
  } catch (error) {
    console.log("An error occurred while registering instructor", error);
  }
});
const generateAccessToken = async (userId) => {
  try {
    const user = await Instructor.findById(userId);
    console.log("user", user);
    const accessToken = await user.generateAccessToken();

    user.save({ validateBeforeSave: true });

    return { accessToken };
  } catch (error) {
    console.log(error);
  }
};
const instructorLogin = asyncHandler(async (req, res, next) => {
  try {
    const { authToken } = req.body;
    const tokenValue = await verifyFirebaseToken(authToken);
    console.log("instructor token value: " + tokenValue);
    console.log(tokenValue);
    if (tokenValue.message) {
      return next(new AppError("Unauthorized access token", 404));
    }

    if (tokenValue.firebase.sign_in_provider === "phone") {
      const instructor = await Instructor.findOne({
        mobile: tokenValue.phone_number.slice(3),
      });
      console.log("current instructor", instructor);
      if (!instructor) {
        return next(new AppError("Instructor not found ", 404));
      }

      const { accessToken } = await generateAccessToken(instructor._id);
      const options = {
        httpOnly: true,
        secure: true,
      };
      console.log("instructor access token", accessToken);
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(
          new ApiResponse(200, instructor, "Instructor logged in successfully")
        );
    }
  } catch (error) {
    console.log("An error occurred while login instructor", error);
  }
});

const instructorLogout = asyncHandler(async (req, res, next) => {
  try {
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log("logout instructor");
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .json(new ApiResponse(200, {}, "Instructor logged out successfully"));
  } catch (error) {
    console.log("An error occurred while logging out instructor", error);
  }
});

const updateInstructorProfile = asyncHandler(async (req, res, next) => {
  try {
    const { qualification, city, description, completeAddress } = req.body;
    console.log(
      "Update instructor profile",
      qualification,
      city,
      description,
      completeAddress
    );

    if (!qualification || !city || !description || !completeAddress) {
      return next(new AppError("All fields are required"));
    }
    const instructor = await Instructor.findByIdAndUpdate(
      req.instructor?._id,
      { $set: { qualification, city, description, completeAddress } },
      { new: true }
    );
    console.log("Instructor updated", instructor);
    res
      .status(200)
      .json(
        new ApiResponse(200, instructor, "Account details updated successfully")
      );
  } catch (error) {
    console.log("instructor update profile error", error);
  }
});

const updateProfilePhoto = asyncHandler(async (req, res, next) => {
  try {
    console.log("instructor", req.file.path);

    const profilePhoto = req.file.path;
    if (!profilePhoto) {
      return next(new AppError("Profile photo is required", 400));
    }

    const instructor = await Instructor.findById(req.instructor?._id);

    if (instructor.profilePhotoPublicId) {
      const { result } = await deleteFromCloudinary(
        instructor.profilePhotoPublicId
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
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      req.instructor?._id,
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
          updatedInstructor,
          "Profile photo updated successfully"
        )
      );
  } catch (error) {
    console.log("profilePhoto update profile error", error);
  }
});

const deleteProfilePhoto = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findById(req.instructor?._id);
  console.log("cludinary id issss", instructor);

  if (!instructor.profilePhotoPublicId) {
    return next(new AppError("Profile Photo not available", 404));
  }

  const { result } = await deleteFromCloudinary(
    instructor.profilePhotoPublicId
  );
  // console.log("instructor id: " + instructor);
  console.log("Deleted", result);

  if (result === "ok") {
    instructor.profilePhoto = "";
    instructor.profilePhotoPublicId = "";

    await instructor.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Profile photo deleted successfully"));
  } else {
    return next(new AppError("Error while deleting profile Photo", 400));
  }
});

export {
  instructorRegistration,
  instructorLogin,
  instructorLogout,
  updateInstructorProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
};
