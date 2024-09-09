const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

// this is to get access to the cookie ("jwt") in our request. we will install this middleware
const cookieParser = require("cookie-parser");

const app = express();

// THIS IS USE TO RENDER A SERVER-SIDE WEBSITE USING A TEMPLATE ENGINE CALLED "PUG"
// this will tell express the template engine we are using
app.set("view engine", "pug");
// we will define where these fields are located in our filesystem
// our pug system are actually called views in express. That is because the template are the Views in our Model View Control (MVC) system
// In order to define which folder our views are actually located in, we will define the path
app.set("views", path.join(__dirname, "views"));

// This is how to serve a static file. when our request url can not be found in the routes, this will be the default url. the public folder will be the root
// SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

// 1) GLOBAL MIDDLEWARES

// It is best to use the helmet package early in the middleware stack so that the HEADERS are really sure to be set
// SET SECURITY HTTP HEADERS. Content Security Policy
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        ,
        "https://events.mapbox.com",
        "ws://127.0.0.1:59009"
      ],
      scriptSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://cdnjs.cloudflare.com",
        "https://js.stripe.com"
      ], // Include this if you're also loading scripts
      frameSrc: ["https://js.stripe.com"],
      workerSrc: ["'self'", "blob:"] // If you still need workers
    }
  })
);

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// This will prevent our website from too many request from the same IP in a short period of time
// we want to allow only 100 request per 1 hour from the same IP
// LIMIT REQUEST FROM THE SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, Please try again in an hour!"
});

// since we want to apply this limiter only to the /api routes, we will include  it. it will affect all the routes that starts /api
app.use("/api", limiter);

// This is a middleware. This will modify the incoming data. This will add the data coming from the request thatwas sent to the express req body
// BODY PARSER, READING DATA FROM THE BODY INTO REQ.BODY (req.body)
// we can limit the amount of data that the request will accept. if the body is larger than 10kb, it will not be accepted. but we can decide not to add the option
app.use(express.json({ limit: "10kb" }));

// this will get the data coming from the form body directly
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// this parses the data from cookies
app.use(cookieParser());

// TO SANITIZE DATA THAT WAS SENT AFTER IT HAS BEEN PARSED TO PREVENT MALICIOUS DATA
// Data sanitization against NoSQL query injection
// this qill look at the request body and request query string and request params and it will filter out all of the dollar signs ($) and dots (.)
app.use(mongoSanitize());

// Data sanitization against XSS attack
// this will clean any user input from malicious  HTML code
app.use(xss());

// hpp stands for HTTP PARAMETER POLLUTION. it prevents duplicate parameters.
// if we want to allow some parameters to be more than more in filtering, we will parse an option to whirelist them
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price"
    ]
  })
);

// TEST MIDDLEWARE just for testing
/*
app.use((req, res, next) => {
  console.log(req.headers);

  next();
})
*/

/*
// ROUTE
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Hello from the server side!", app: "Natours" });
});

app.post("/", (req, res) => {
  res.send("You can post to this endpoint..");
});

*/

// 2) ROUTE HANDLERS

/*
app.get("/api/v1/tours", getAllTours);
app.get("/api/v1/tours/:id", getTour);
app.post("/api/v1/tours", createTour);
app.patch("/api/v1/tours/:id", updateTour);
app.delete("/api/v1/tours/:id", deleteTour);
*/

// 3) ROUTES

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// This will handle all the routes that is not defined or handled by us and this should be the last part after the other routes
app.all("*", (req, res, next) => {
  // we want to send back a response in the json format
  /*
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server`
  });
  */

  /*
  // the error message that is parse in the error instance is what will be used in the error middleware
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = "fail";
  err.statusCode = 404;
  */

  // whatever we pass into next() function is always considered as an error
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// EXPRESS MIDDLEWARE ERROR HANDLING
app.use(globalErrorHandler);

// 4) START UP A SERVER
module.exports = app;
