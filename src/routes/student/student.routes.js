import express from "express";
import {
  studentRegistration,
  studentLogin,
  studentUpdateProfile,
  studentLogout,
  updateProfilePhoto,
  deleteProfilePhoto,
} from "../../controllers/student/student.controller.js";
import { studentVerifyJWT } from "../../middlewares/student.auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { listOfAllCourses } from "../../controllers/student/studentCourse.controller.js";

const router = express.Router();

router.route("/register").post(studentRegistration);
router.route("/login").post(studentLogin);
router.route("/logout").get(studentVerifyJWT, studentLogout);
router
  .route("/update-student-profile")
  .post(studentVerifyJWT, studentUpdateProfile);
router
  .route("/update-profile-photo")
  .post(studentVerifyJWT, upload.single("profilePhoto"), updateProfilePhoto);

router
  .route("/delete-profile-photo")
  .delete(studentVerifyJWT, deleteProfilePhoto);

router.route("/list-of-courses").get(listOfAllCourses);

export default router;
