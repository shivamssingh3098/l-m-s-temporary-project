import express from "express";
import {
  changePassword,
  loginAdminOrStaff,
  logoutAdminOrStaff,
  registerAdminAndStaff,
} from "../../controllers/admin/admin.controller.js";
import { verifyAdminOrStaffJWT } from "../../middlewares/admin.auth.middleware.js";
import {
  allocateCourseToInstructor,
  approveInstructors,
  blockInstructors,
  deallocateCourse,
  deleteInstructor,
  getAllInstructor,
  listOfCoursesAndInstructor,
  unapproveInstructors,
  unblockInstructors,
} from "../../controllers/admin/instructors.controller.js";
import {
  blockCourse,
  createCourse,
  deleteCourse,
  getAllCourses,
  unblockCourse,
  updateCourseTiming,
} from "../../controllers/admin/course.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/register").post(registerAdminAndStaff);
router.route("/login").post(loginAdminOrStaff);
router.route("/logout").post(verifyAdminOrStaffJWT, logoutAdminOrStaff);
router.route("/change-password").post(verifyAdminOrStaffJWT, changePassword);
router.route("/all-instructors").get(verifyAdminOrStaffJWT, getAllInstructor);
router
  .route("/instructor-delete")
  .delete(verifyAdminOrStaffJWT, deleteInstructor);

router
  .route("/block-instructors")
  .patch(verifyAdminOrStaffJWT, blockInstructors);

router
  .route("/approve-instructor")
  .patch(verifyAdminOrStaffJWT, approveInstructors);

router
  .route("/unapprove-instructors")
  .patch(verifyAdminOrStaffJWT, unapproveInstructors);

router
  .route("/unblock-instructors")
  .patch(verifyAdminOrStaffJWT, unblockInstructors);

router
  .route("/create-course")
  .post(verifyAdminOrStaffJWT, upload.single("syllabus"), createCourse);
router.route("/get-all-course").get(verifyAdminOrStaffJWT, getAllCourses);
router.route("/block-course").patch(verifyAdminOrStaffJWT, blockCourse);
router.route("/unblock-course").patch(verifyAdminOrStaffJWT, unblockCourse);

router
  .route("/course-instructor")
  .get(verifyAdminOrStaffJWT, listOfCoursesAndInstructor);
router
  .route("/assign-course")
  .patch(verifyAdminOrStaffJWT, allocateCourseToInstructor);

router
  .route("/update-course-timing")
  .put(verifyAdminOrStaffJWT, updateCourseTiming);

router.route("/delete-course").delete(verifyAdminOrStaffJWT, deleteCourse);
router
  .route("/deallocate-course")
  .patch(verifyAdminOrStaffJWT, deallocateCourse);

export default router;
