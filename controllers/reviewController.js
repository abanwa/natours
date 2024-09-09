const Review = require("../models/reviewModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getAllReviews = factory.getAll(Review);
/*
exports.getAllReviews = catchAsync(async (req, res, next) => {
  // if the route has an tourId parameter, we will find/get the review of that particular tour base on the tourId
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  // ifbthere is no tourId, the filter will be an empty object. In that case, we will find all the review
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews
    }
  });
});

*/

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // req.user is coming from protect() midleware. we attached the users details to the request (req)
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

// get a single review
exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);
/*
exports.createReview = catchAsync(async (req, res, next) => {
  //   console.log(req.user);
  //   console.log("user._id ", req.user._id);
  //   console.log("user.id ", req.user.id);
  // user.id and user._id are the same
  // BECAUSE WE ARE NOW USING IT AS A MIDDLEWARE IN setTourUserIds, we will comment it

  //   if (!req.body.tour) req.body.tour = req.params.tourId;
  // req.user is coming from protect() midleware. we attached the users details to the request (req)
  //   if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      review: newReview
    }
  });
});

*/

// TO UPDATE REVIEW
exports.updateReview = factory.updateOne(Review);

// TO DELETE REVIEW
exports.deleteReview = factory.deleteOne(Review);
