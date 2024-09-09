const mongoose = require("mongoose");
const Tour = require("./tourModel");

// This Review table needs to belong to a tour (the tour that user is reviewing) and also needs an author (the user that made the review)
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."]
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."]
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// we will make the tour unique and the user that review a tour should also be unique. a user can not review the same tour twice
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// we will populate or all the data of the tours and users we referenced in the review table based on their ids. The .populate() function will AUTOMATICALLY gets them. if we want to populate() multiple field, we will just call the .populate() again. for the tour, it wil only select the tour name
// QUERY MIDDLEWARE

reviewSchema.pre(/^find/, function (next) {
  // This will come populate both the tour and the user
  /*
  this.populate({
    path: "tour",
    select: "name"
  }).populate({
    path: "user",
    select: "name photo"
  });
  */

  // this will populate only the user
  this.populate({
    path: "user",
    select: "name photo"
  });

  next();
});

// We will create a function which will take in an tour ID and calculate the average rating and the number of rating that exist in our collection for that exact tour then in the end, we will update the corresponding tour document
// In order to use that function, we will use MIDDLEWARE to basically call the function each time there is a new review or update  or deleted
// we will write a static method on our schema
reviewSchema.static.calcAverageRatings = async function (tourId) {
  // the tourId is for the tour for which the review belongs to
  // To do the calculation, we will do aggregated pipeline
  // For a static method, the this keyword points to the current model. we need to call the aggregate directly on the Model (Review) that is why we are using a static method because the "this" will now point to the Model. In the aggregate, we will parse in an array of all the stages that we want
  // the first thing in the aggregate is to select all the review that belongs to that tour base on the id
  // the next stage, we will calculate the statistics. we will use a group stage
  // in the group stage, the first thing we will specify is the id and then the field that all the documents have in common that we want to group by. in this case, that will be the $tour
  // each review has a rating field. That is where we want to calculate the average from
  // Remember, this returns a promise. we will await it and store it in a variable called stats. we will then update the Tour document with this statistics

  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  // we will find the current Tour base on the tourId and update it
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// WHEN WE INSERT/CREATE A REVIEW
// We will call the calcAverageRating using middleware each time a new review is created
// in this kind of middleware, the "this" keyword point to the document that is being saved
// we use post("save") because we want the document to be saved in the collection before we will perform the calculation
reviewSchema.post("save", function () {
  // the this keyword point to the current review
  // the this.tour is the current tourId belonging to the tour that we are reviewing
  // we can not access the Review because it has not been declared/defined yet. so, we will use the this.constructor() because it still points to the current Model
  this.constructor.calcAverageRatings(this.tour);
});

// WHEN WE UPDATE/DELETE A REVIEW STEP 1
// The goal is to get access to the current review document because for the "findOneAnd" Middleware is usually for the query and not document. There, by default, the "this" keyword will point to the query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // we will execute the query and that will give us the document that is currently being processed. in order to do that, we will use findOne. this will return the NONE updated data/document because of the "pre" and we can not use the "post" because if we use post, we can not have access to the findOne() query because it have already been executed. after we get the review, we will assign it to the table/field
  this.r = await this.findOne();

  next();
});

// continuation, STEP 2
reviewSchema.post(/^findOneAnd/, async function () {
  // we will get the id of the review from the table/field we assigned it to. the r.tour is the id of the tour that we are reviewing
  // await this.findOne() does NOT work here, query has already executed
  calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
