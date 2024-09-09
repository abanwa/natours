const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

// FUNCTION TO GENERATE TOKEN
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// A COOKIES is basically a small piece of text that the server can send to client.Then when the client receives a cookie, it will AUTOMATICALLY store it and  AUTOMATICALLY send it back along with all feature request to the same server. A browser automatically store a cookie that it recieves and send it back along with all feature request to that server where it came from

// THE FUNCTION WILL SEND THE GENERATED TOKEN
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // In order to send the cookie to the browser, we basically attach it to the response obejct. we will parse the name of the cookie and the cookie we want to send (token) and the a couple of options for the cookie. The first option we will speicify is the expires property. This is  expires property will make the browser/client to delete the cookie after it has expired.
  // NOTE: we will set the expiration date to be the same that we set for the token
  // the expiration is express in miliseceonds
  // the secure option means that the cookie will only be sent on an encrypted connection. That is when we are using "https"
  // the httpOnly option will make it so that the cookie will not be accessed or modified in anyway by the browser. This is important in order to prevent DOS cross scripting attack
  // when we set httpOnly to true, what the browser will do is just to receive the cookie, store it and send it automatically along with every request
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true
  };

  // we will set cookie secure property to true only when we are using a https: connection
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // we do not want the user's password to show when we create/insert (signup) a new user
  // This will remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};

// we will create the jwt token when the user signup
exports.signup = catchAsync(async (req, res, next) => {
  //   const newUser = await User.create(req.body);

  // this will only allow the data that we need to be used to create the new user. if user tries to manually input a field/role that was not specified, it will not be inserted
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // we will create our jwt token. the first argument is the payload, in this case, we only want the id of the user. the second argument is the SECRET_KEY (anything can serve as our secret key). the token header will be created automatically. the third option will be when the jwt token will expire/not be valid. The third argument will add additional information to the payload. that is, it will be added to the payload
  /*
  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser
    }
  });
  */

  // SEND SIGN UP EMAIL
  // we will  get the protocol (http/https) and host (domain) from the request
  const url = `${req.protocol}://${req.get("host")}/me`;
  // we will await it because sendWelcome() is an async function
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

// we will issue the token when the email and password is correct
exports.login = catchAsync(async (req, res, next) => {
  // we will read the email and pasword from the req body
  const { email, password } = req.body;
  // 1) Check if email and password exist
  // the
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2)  Check if user exists && password  is correct. becasue of the select:false for the password field in the User model/table, the password will not be selected. to select the password, we will explicitly select it. will a plus(+) sign infront of the field
  const user = await User.findOne({ email }).select("+password");
  // the instance method that was created to compare password in the Usermodel will be avaliable for all document for that User collection/table
  // correctPassword is an asynchronous function, so we will use await for it
  // if the user does not exist, this correctPassword() function will not run. So, we will put it in a if condition
  // correctPassword will return a TRUE/FALSE

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything is ok, send token to client. Here, we will generate the token again
  /*
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token
  });
  */

  createSendToken(user, 200, res);
});

// LOGOUT
// we will send the request with the exact same cookie name but without the token
// we will also set the expiration date to be very short (10seconds)
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: "success"
  });
};

// THIS IS A MIDDLEWARE FUNCTION THAT WILL CHECK IF A USER IS LOGGED IN OR NOT
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exist/ is there
  // A common practice is to send the token using an HTTP header with the request. we will get the token from the request header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    // if there is no COOKIE from the authorization header, we will check if there is a cookie from the request
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Validate token / Verification.
  // we will verify if the token has not been manipulated or if the token has not expired. the first argument is our token and the second argument is our secret key we used to generate the token.
  // we will promisify this function, basically to return a promise. in that way, we can use async and await just like every other asynchronous function. In order to do that, we will use a built-in promisifying function. we will require the built-in "util" module

  // if we don't want it like this, we can parse a third argument which is a callback function. it will run after the token has been decoded. it will carry two argument which is the err and the decoded token. then we run the code we want to run. the verify() is not an asynchronous function that is why we used promisify().
  // the decoded will be the payload we used to create the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }

  // 4) Check if user changed password after the JWT/token was issued
  // we will check if the user has recently changed their password after the token was issued.To implement this step, we will create another instance method on the User collection/table. the method is called changedPasswordAfter. what was parsed is the timestamp the token was issued
  // decode.iat is the time the token was created/issued/generated. it is added automatically be the JWT in our payload
  // if password is changed after the token is created, it will return TRUE but if password is changed before token is generated, it will return FALSE
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please login again", 401)
    );
  }

  // if there are no problems in any of these steps above, the the next() will be called
  // GRANT ACCESS TO PROTECTED ROUTE

  // we will added the entire user data to the request. in this case, the user data will be attached to the request. this might be useful when we want to get the logged in user data without checking from users collection/table again
  req.user = currentUser;

  // this is done because we are using server-sdie rendering so that the templates can have access to the user too. Otherwise, we will not add this line of code
  res.locals.user = currentUser;

  next();
});

// THIS IS TO CKECK IF THE USER IS LOGGED IN OR NOT.
// The goal is not to protect any route so there will NEVER be any error

exports.isLoggedIn = async (req, res, next) => {
  // it will always be checked using the cookie. this is to check if the cookie is set or not
  if (req.cookies.jwt) {
    try {
      // if there is no COOKIE from the authorization header, we will check if there is a cookie from the request

      // 1) Validate token / Verification.
      // we will verify if the token has not been manipulated or if the token has not expired. the first argument is our token and the second argument is our secret key we used to generate the token.
      // we will promisify this function, basically to return a promise. in that way, we can use async and await just like every other asynchronous function. In order to do that, we will use a built-in promisifying function. we will require the built-in "util" module

      // if we don't want it like this, we can parse a third argument which is a callback function. it will run after the token has been decoded. it will carry two argument which is the err and the decoded token. then we run the code we want to run. the verify() is not an asynchronous function that is why we used promisify().
      // the decoded will be the payload we used to create the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the JWT/token was issued
      // we will check if the user has recently changed their password after the token was issued.To implement this step, we will create another instance method on the User collection/table. the method is called changedPasswordAfter. what was parsed is the timestamp the token was issued
      // decode.iat is the time the token was created/issued/generated. it is added automatically be the JWT in our payload
      // if password is changed after the token is created, it will return TRUE but if password is changed before token is generated, it will return FALSE
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // if there are no problems in any of these steps above, the the next() will be called
      // GRANT ACCESS TO PROTECTED ROUTE

      // we will added the entire user data to the request. in this case, the user data will be attached to the request. this might be useful when we want to get the logged in user data without checking from users collection/table again
      // THERE IS A LOGGED IN USER
      // we will make our user to be accessible my all our templates if the user is logged in
      // each template will have access to a variable called user which is the logged in user
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }

  // if there is no cookie, the next() middleware will still be called
  next();
};

// AUTHORIZATION. THIS WILL GIVE USERS PERMISSION TO ACCESS CERTAIN RESOUCES. NOT ALL USERS CAN ACCESS THEM . ONLY ADMIN
// Normally, we can not parse argument to a middleware function. But in this case, we really want to. we want to parse in the roles of who are allowed to access the route/resource. In this case, the admin and lead-guide. we will create a wrapper function which will then return the middleware function that we want to create. we want to parse arbitiary number of argument. we will use the ES6 spread syntax
exports.restrictTo = (...roles) => {
  // this is the middleware function we will return. this middleware function will then get access to the role arguments because there is a closure
  return (req, res, next) => {
    //....role will be an array because of the spread syntax
    // roles ["admin", "lead-guide"]
    // we will give a user access to the resource if the user's role is inside the roles that we parsed in
    // we will check if the user's role is included in the roles that we parsed in
    //we are able to access the user's role because after the authContoller.protected() middleware function finish running, it attached the current user's data/details to the request body (that is req.user = currentUser) in authController.protect.
    // this was possible also because authConroller.protect came first before authContoller.restrictTo
    // the 401 code is forbidden
    // if (!roles.includes(req.body.role)) {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    // otherwise, we will go to the next middleware or function
    next();
  };
};

// TO RESET PASSWORD FUNCTIONALITY. THIS HAS TWO STEPS
// The user will send a POST request with his email as payload, then this will create a reset token (random unique strings or number or mixed) and send back to the user's email address that was provided with a link to his email address. the user then clicks on that link, it will take the user to a page where he will provide his new password and confirm password to be updated

// THIS IS THE FIRST STEP
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address.", 404));
  }

  // 2) Generate the random reset token
  // we will create an instance method for this in the User collection/table in the userModel. the encrypted resetToken wil be stored in our User collection/table while the plain resetToken before it was encrypted will be return so that we will send it to the user email
  const resetToken = user.createPasswordResetToken();

  // Now, we will save encrypted resetToken and the expiringTime in the User table/colllection
  // from our UserModel or userSchem, the "pre" functions that we wrote that will run before the data is saved, we will parse a function in the .save() to diabled them. if we didn't use any "pre" function in our userSchema, we wouldn't have any need to do this. the object that we will parse in the .save() is {validateBeforeSave: false}
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user as an email
  // we will send an email to the user
  // we will use node mail to send the email message. we will install ndoe mailer package

  try {
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    // we will send email but remember that the sendEmail() is an asynchronosu function, therefore, we will use await here too
    // email: user.email or req.body.email

    // await sendEmail({
    //   email: user.email,
    //   subject: "Your password reset token (valid for 10 min)",
    //   message
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!"
    });
  } catch (err) {
    // if there is an error when sending the email, we will reset the token and the resetToken expiring time
    user.PasswordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // we will save them in our User table/collection
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        `There was an error sending the email. Try again later ${err}`,
        500
      )
    );
  }
});

// THIS IS THE SECOND STEP. FIRST STEP IS ABOVE
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token. we will use the reset token that was attached to the URL sent in the user's email to get the user's details
  // we will encrypt the original reset token again and then compare it with the one we have in oru database (user table/collection)
  // this token is attached as a param to the /resetPassword/:token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // we will use the reset token to find the user in our database. this will find the user that has the token to reset password
  // in the query, we will also check if the token as not expired. that is, if the passwordResetExpires time is greater than the current time. if the passwordResetExpires time is greater than the current time, that mean, the reste token has NOT expired otherwise, it has expired
  // if there is a user but the token has expires, it will not null
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // we will set/update the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // we will delete the password reset token and password reset expires fields in our user table/collection
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //we will the save the new data or update the changes in our user table/collection.
  // NOTE: due to the "pre" function in the model, before the data is saved to our user table/collection, the password will be encrypted in the userModel/ userSchema. also, the password validation checking if the password and passwordConfirm are the same will hapen in the user model table/collection before the changes are saved
  await user.save();

  // 3) Update changedPasswordAt property for the user. that is , update the time the password was updated in the changePasswordAt field.
  // we will save the time the password has been updated using an a "pre" function in the user model schema. it will be updated/run before the data is saved

  // 4) Log the user in. send the JWT
  // here, we will generate the user token and log the user in
  /*
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token
  });
  */
  createSendToken(user, 200, res);
});

// THIS IS FOR THE LOGGED IN USER TO UPDATE HIS PASSWORD WITHOUT FORGETTING IT
// This password updating functionality is only for logged in users

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the User table/collection
  // Remember that is /updatePassword route is only for authenticated users. that is for logged in users. Remember, to be authenticated, the user has to pass the protect middleware in which the user detail/data is attached to the request (req). that is how we could access the user details. Remember we have to explicitly select the password field because if the user Model, we set the select to false.  (select:false)
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  // we will use the instance method we defined to check if the the current passowrd and the user password in the table is the same
  // the req.body.passwordCurrent is the currentpassword the user entered and the user.password is the user password in the table. the correctPassword() is an asynchronous function, we will await it. it will return a TRUE or FALSE. if the two passwords are not the same, we will just return next(with an error)
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  // we will update the user password in the user table/collection
  // the password will be encrypted before it is saved using the "pre" in the userSchema model
  // req.body.password is the new password and req.body.passwordConfirm is the confirm password of the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // In this case, we do not turn of the validation because we want the validate functions in the userSchema or model records to validate the data that we want to save. In this case, we use validate: {validator: function(){}} for the passwordConfirm
  // that will check whether the password and the passwordConfirm are the same
  // NOTE: User.findByIdAndUpdate() will NOT work as intended because the validator function in the passwordConfirm will not run/work and all the "pre" save function in the userSchema will not also run/work therefore, the password will not be encrypted
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
