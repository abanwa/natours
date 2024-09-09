const express = require("express");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

// FOR FORGOTTEN PASSWORD
// this will receive the email as payload
router.post("/forgotPassword", authController.forgotPassword);
// this will receive the new password and the random reset token strings generated in /forgotPassword
router.patch("/resetPassword/:token", authController.resetPassword);

// REMEMBER, MIDDLEWARE RUN IN SEQUENCE. all the routes below will have to pass through the  this middleware before it gets to the routes below. That is, only logged in users can access these routes below this middleware
router.use(authController.protect);

// THIS IS TO UPDATE PASSWORD WHEN USER IS LOGGED IN. this only works for logged in users. that is why we use authContoller.protect middleware
// There will be no need to attach the authController.protect in this route since we use it above. it will automatically work for all the routes below it
router.patch("/updateMyPassword", authController.updatePassword);

// GET CURRENT LOGGED IN USER DETAILS
router.get("/me", userController.getMe, userController.getUser);
// THE CURRENT LOGGED IN USER TO UPDATE HIS DATA

router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
// THE CURRENT LOGGED IN USER TO DELETE HIS ACCOUNT
router.delete("/deleteMe", userController.deleteMe);

// REMEMBER, MIDDLEWARE RUN IN SEQUENCE. all the routes below will have to pass through the  this middleware before it gets to the routes below. That is, only admins can access these routes below this middleware
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
