import express from "express";
import {
  deleteProfilePhoto,
  instructorLogin,
  instructorLogout,
  instructorRegistration,
  updateInstructorProfile,
  updateProfilePhoto,
} from "../../controllers/instructor/instructor.controller.js";
import { instructorVerifyJWT } from "../../middlewares/instructor.auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import {
  createClass,
  createStudyMaterial,
  publishClass,
  unpublishClass,
  uploadVideoOfClass,
} from "../../controllers/instructor/class.controller.js";
import {
  changeTopicStatus,
  createTopics,
  listOfAllCoursesAssignedToInstructor,
} from "../../controllers/instructor/course.controller.js";

const router = express.Router();

router.route("/register").post(instructorRegistration);
router.route("/login").post(instructorLogin);
router.route("/logout").post(instructorVerifyJWT, instructorLogout);
router
  .route("/update-instructor-profile")
  .post(instructorVerifyJWT, updateInstructorProfile);
router
  .route("/update-profile-photo")
  .post(instructorVerifyJWT, upload.single("profilePhoto"), updateProfilePhoto);
router
  .route("/delete-profile-photo")
  .delete(instructorVerifyJWT, deleteProfilePhoto);
router
  .route("/create-class")
  .post(instructorVerifyJWT, upload.single("thumbnail"), createClass);

router
  .route("/upload-video/:classId")
  .post(instructorVerifyJWT, upload.single("video"), uploadVideoOfClass);
router
  .route("/create-study-materials/:classId")
  .post(instructorVerifyJWT, upload.single("pdf"), createStudyMaterial);

router
  .route("/publish-class/:classId")
  .patch(instructorVerifyJWT, publishClass);
router
  .route("/un-publish-class/:classId")
  .patch(instructorVerifyJWT, unpublishClass);

router
  .route("/assigned-courses")
  .get(instructorVerifyJWT, listOfAllCoursesAssignedToInstructor);

router
  .route("/create-course-topics/:courseId")
  .post(instructorVerifyJWT, createTopics);

router
  .route("/update-topics/:topicId")
  .put(instructorVerifyJWT, changeTopicStatus);

export default router;
