const express = require("express");

const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

// the option {mergeParams: true} will make it possible to access parameters in other routes
const router = express.Router();

router.use(authController.protect);

// THIS ROUTE IS FOR THE USER/CLIENT TO GET THE CHECKOUT SECTION. Only the authenticated/logged in users can access the route
// we will use the tour id of that particular tour that the user wants to book to get the details of the tour to create that tour checkout session
router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

router.use(authController.restrictTo("admin", "lead-guide"));

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
