const express = require("express");

const tourController = require("../controllers/tourController");

const authController = require("../controllers/authController");

const reviewRouter = require("../routes/reviewRoutes");

const router = express.Router();

// Param Middlerware. This runs only when a certain parameter is in our url example like the ":id" param. The 4th argument "val" is actually the value of the parameter in question
// router.param("id", tourController.checkID);

/*

// OLD ONE; BEFORE WE USE THE reviewRouter
router
  .route("/:tourId/reviews")
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview
  );
  */

// we will says, these two routers should use the reviewRouter if it has a router like this
// Remember, "router" itself is just a middleware
// we will now make reviewRouter to have access to :tourId by parsing the option {mergeParams: true} inside the express.Router({mergeParams: true}) in reviewRoutes.js
// This is a POST
router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

// search for Tours within a certain distance. lets say you live in a certain point and you want to know which tour starts in a certain distnace from you. :ditance is the distance to find route from where you live. :latlng is the coordinate of where you live
// lets say you live in Los Angelos and you want to find all the tours within a distance of 300miles
// :unit is the unit of the distance (miles/kilometers/meters)
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

// we will get all the distances of the tours within a certain point
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
