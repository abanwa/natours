const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.use(viewsController.alerts);

// This will look for the base file in the view folder when the route is "/"
// it will go into the view folder and look for the file name "overview"
// This is also the route that will be called after the user booking payment is successful
router.get(
  "/",

  authController.isLoggedIn,
  viewsController.getOverview
);

router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);

// this is when we use GET /login. The normal login is POST /login
// This is to get the login form
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);

// the will fetch the user account page
router.get("/me", authController.protect, viewsController.getAccount);

// the will fetch all the bookings a logged in user has booked
router.get(
  "/my-tours",
  // bookingController.createBookingCheckout,
  authController.protect,
  viewsController.getMyTours
);

router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
