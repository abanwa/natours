const mongoose = require("mongoose");

const dotenv = require("dotenv");

// TO HANDLE SYNCHRONOUS ERROR. it should alway be at the top of our code
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 🔥 shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// we will connect our database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("DB connection successful");
  });

const port = process.env.PORT || 3000;

// we store the server in a variable because we want to shut it down in case error occurs outside of express
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

// HANDLER ERROR OUTSIDE OF EXPRESS
// this handles all the rejections that occurred in asynchronous code that were not previously handled
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 🔥 shutting down...");
  console.log(err.name, err.message);
  // we close the server
  server.close(() => {
    process.exit(1);
  });
});

// This happens when we deploy our website to Heroku
// SIGTERM is a signal that is used to cause a program to really STOP running. it's a polite way to ask a program to terminate
process.on("SIGTERM", () => {
  console.log("✋SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("🔥 Process terminated!");
  });
});
