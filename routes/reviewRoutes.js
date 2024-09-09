const express = require("express");

const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

// the option {mergeParams: true} will make it possible to access parameters in other routes
const router = express.Router({ mergeParams: true });

// WE WILL PROTECT ALL THE ROUTES FOR THE REVIEW. ANYBODY THAT IS NOT AUTHENTICATED (LOGGED IN) CAN NOT POST ON THE REVIEW OR GET  OR DEL OR UPDATE
router.use(authController.protect);

// if the router is POST /reviews or
//  POST/GET  /:tourId/reviews, they will match the review "/" route

// Only users will be able to post a review
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

// Only users and admin can update a review
// Only users and admins can delete the review
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  );

module.exports = router;
