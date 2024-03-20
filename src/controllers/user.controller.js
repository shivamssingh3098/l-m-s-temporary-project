import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { username, email, fullName, password } = req.body;
  //validation - not empty

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    console.log("tested successfully");

    return next(new AppError("All Fields are required", 400));
  }
  //check if user already exists : username, email
  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitedUser) {
    return next(new AppError("User already exists", 409));
  }
  //check for images, check for avatar
  let avatarLocalPath;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    return next(new AppError("Avatar file is required", 400));
  }

  //upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    return next(new AppError("Avatar file is required", 400));
  }
  //create user object - create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  //remove password and refresh token field from response

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user creation
  if (!createdUser) {
    return next(
      new AppError("Something went wrong while registering the user", 500)
    );
  }

  //return res
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: true });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
  }
};

const loginUser = asyncHandler(async (req, res) => {
  try {
    // get -> username or email, password
    const { username, email, password } = req.body;
    console.log("username", username, email, password);

    if (!(username || email)) {
      return next(new AppError("Username or email is required", 404));
    }

    // check if user is already registered or not
    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // verify password

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return next(new AppError("Invalid user credentials", 401));
    }

    // if password correct generate accessToken and refreshToken

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    //send cookie to frontend
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: accessToken, refreshToken, loggedInUser },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.log(error);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    // console.log("User logged out successfully");
    const ress = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true }
    );

    console.log("User logged out", ress);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {}
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log("Refreshing access token", req.cookies);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return next(new AppError("Unauthorized request", 401));
  }
  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      return next(new AppError("Invalid refresh token", 401));
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return next(new AppError("Refresh token is expired or used", 401));
    }
    const { newRefreshToken, accessToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token updated successfully"
        )
      );
  } catch (error) {
    console.log("Error updating refresh token", error);
    return next(new AppError("Error updating refresh token", 401));
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log("oldPassword", oldPassword);
    const user = await User.findById(req.user?._id);
    console.log("user to change password", user);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      return next(new AppError("Invalid old password", 401));
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password updated successfully"));
  } catch (error) {
    console.log("Password not updated successfully", error);
  }
});

const getCurrentStudent = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
      );
  } catch (error) {
    console.log(error);
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { userName, email } = req.body;
    if (!userName || !email) {
      return next(new AppError("All fields are required", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { userName, email } },
      { new: true }
    ).select("-password");
    res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    console.log(error);
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      return next(
        new AppError("Error while uploading avatar to cloudinary", 400)
      );
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: avatar.url } },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image uploaded successfully"));
  } catch (error) {
    console.log(error);
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      return next(new AppError("Avatar file is missing", 400));
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
      return next(
        new AppError("Error while uploading cover Image to cloudinary", 400)
      );
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { coverImage: coverImage.url } },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image uploaded successfully"));
  } catch (error) {
    console.log(error);
  }
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;
    if (!username?.trim()) {
      return next(new AppError("User name missing", 404));
    }
    // const userProfile = await User.findOne({ username: username });
    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTO",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: { $size: "$subscribedTO" },
        },
      },
    ]);
  } catch (error) {
    console.log(error);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentStudent,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
