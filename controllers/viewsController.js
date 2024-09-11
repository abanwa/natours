const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === "booking") {
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later.";
  }
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from our tour collection/table
  const tours = await Tour.find();

  // 2)  Build template

  // 3) Render that template using tour data from step (1)

  res.status(200).render("overview", {
    title: "All Tours",
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and guides) the "reviews" is a virtual field/column in the Tour table
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user"
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name.", 404));
  }

  // 2) Build template

  // 3) Render template using data from step (1)
  res.status(200).render("tour", {
    title: `${tour.name} tour`,
    tour
  });
});

// we will get the login form. this will go to the view folder and look for a file named login
exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account"
  });
};

// This is to fetch the acount page filled with the logged in user details
exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account"
  });
};

// This will fetch all the bookings the logged in user has booked
exports.getMyTours = catchAsync(async (req, res) => {
  // we will find all the bookings for the current logged in users. Then we will use the bookings to get the tour ids and get the tour data/details that the user booked
  // 1) Find all bookings
  // here, we can use a virtual populate in our Booking model/schema. we can also do it manually here. we need to queries in order to really find tours corresponding to the user booking
  // we will query the booking table base on the logged in user id, it will fetch us all the bookings belonging to that user
  // This will return an array od bookings that has the user id or booked by the user
  // user in the booking table is the logged in user ID
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours base on the returned booking id arrays. get an array of all the tour ids that the user booked
  // tour in the booking table is the tour ID that the users booked. it's tour id
  const tourIDs = bookings.map((el) => el.tour);

  // we will get all the tours corresponding to those tour id that the user booked
  // this will select/find all the tours whose id is in the tourIDs array. it will select all the tours that has an id that is in the tourIDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // we will show the overview page with all the tours that the logged in user booked
  res.status(200).render("overview", {
    title: "My Tours",
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // the req.user.id is coming from the protect route
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  // we will render the account page again
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser
  });
});
