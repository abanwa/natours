const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

// const STRIPE = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  // tourId is the id of the tour from the request (route) parameter
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session/ This will go an API call to stripe
  // WE WILL USE A WEBHOOK AFTER THE PAYMENT IS SUCCESSFUL BUT WE DID NOT IMPLEMENT THAT. WE USE ANOTHER ALTERNATIVE IN THE succes_url via params
  const session = await Stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: {
      user_email: req.user.email,
      tour_id: req.params.tourId
    },
    success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, // user will be redirected to this page if they cancel the payment,
    customer_email: req.user.email, // req.user.email is coming from the protect middleware,
    client_reference_id: req.params.tourId, // this is the id of the tour we want to book. we will use this id and the user id through (user email) to get this session we create

    // in our case, our item(tour) we want to pay for is one. if it's more than our, we could use loop/map through it to. the object properties is coming from stripe like the name, summary are from stripe
    // the images should be an images that is already online. we will use the absolute path. we can specify multiple images but we will use one in our case
    /*
    // OUTDATED
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1
      }
    ]
      */

    // Updated line_items structure
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          },
          unit_amount: tour.price * 100 // Amount in cents
        },
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  // we will send the session back to the client
  res.status(200).json({
    status: "success",
    session
  });
});

// THIS WILL CREATE THE NEW BOOKING IN OUR DATABASE AFTER THE PAYMENT IS SUCCESSFUL
// This is only TEMPORARY, because it's UNSECURED: everyone can make bookings without paying
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  // if there is no tourId and userId and price, just go to the next middleware
  if (!tour && !user && !price) return next();

  // but if the "/" parameters includes the tourId, userId and price, save it in the booking table. Book the tour and user details that was booked,. that is insert the booking details
  await Booking.create({ tour, user, price });

  // we will now redirect the user to the same "/" route withoutbthe parameters
  // this will be how the original url will look like ${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}
  // ${req.protocol}://${req.get("host")}/?tour=cd46gegdeyedye84&user=gede48958594hrbrur84r&price=400
  res.redirect(req.originalUrl.split("?")[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
