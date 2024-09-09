const crypto = require("crypto");

const mongoose = require("mongoose");

const validator = require("validator");

const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  // this will be the default image if the user has no image or is created without an image
  photo: {
    type: String,
    default: "default.jpg"
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!! whenever we want to update user, we will always use .save() and NOT .findOneAndUpdate(). if we update a user password with regular .update(), then this function to validate the user's password will not work.
      validator: function (el) {
        return el === this.password;
      },
      message: "ConfirmPassword must match with the Password"
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// DOCUMENT MIDDLEWARE

// we will encrypt the password here. This will happen when the data wants to be saved.
userSchema.pre("save", async function (next) {
  // we will encrypt the password when the password is changed or inserted
  // if the password has not been modified/changed/inserted .. we will just call the next middleware otherwise, we will encrypt the password
  // only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // HASH the password using bcrypt. Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // we will delete the confirm password. we will delete the confirm password field because we only need the confirm password field for validation. that is why we set it to undefined.
  // delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// This will update the time the password was changed/updated before it is saved. This function will run before the new document/table will be saved
userSchema.pre("save", function (next) {
  // This will run only when we have modified the password field. if the password field is not modified or if we are creating/inserting a new record/user data, the will NOT run, rather it will go to the next() middleware or function. Sometimes, saving the document/table of the user is a bit slower than generating a new token. in that case, the generate token will finish running before the document/table is been saved. in that case, the JWTTimestamp will be greater than the passwordExpires timestamp. it will look like we changed the password after the token was created. in that case, we will minus 1seconds (1000) from when the password was updated to prevent such issues
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// THIS IS A QUERY MIDDLEWARE
// This function will apply to every query that starts with "find" whenever we run or query the User table/collection
userSchema.pre(/^find/, function (next) {
  // the this keyword point to the current QUERY. this query will only "find" documents which has their active field as true. ONLY documents that are active. it will select or find only the documents that their active field is not equal to ($ne) false. that is active != false {active : {$ne: false}}
  this.find({ active: { $ne: false } });
  next();
});

// we will create an instance method. an instance method is a method that will be avaliable on all documents in a certain colection/table in this case, the User collection/table
// candidate password is the password the user parse in the body/req.body
// we will call this function in the authContoller.js for the login() function/route
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // inside here, since the instance method is available on the document, the this keyword will actually point to the document
  // but since the password is set to select:false,  this.password will not be avaliable
  // ideally, if the password field was NOT set to selct:false, we will only need to parse the candidatePassword but now, it is not possible becuase the this.password is not avaliable in the output. that is why we have to parse the userPassword as well
  // the goal is to ONLY return a TRUE or FALSE. TRUE if the passwords are the same and FALSE if the passwords are not the same
  // the bcrypt.compare() will decode and check if the two password are the same
  // the candidatePassword (coming from user) is NOT hashed but the userPassword (from database) is hashed
  return await bcrypt.compare(candidatePassword, userPassword);
};

// In this function, we will parse the JWT timestamp. the time stamp which says when the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Remember, in an instance method, the this keyword always point to the current document. we will create a field in the document/table for date where the password has been changed. this passwordchangedAt field will alway be changed when someone change their password
  // This passwordChangedAt field is only created when the user change his password but will not exist if the user has not changed his password
  if (this.passwordChangedAt) {
    // we will convert the date the password was changed in the passwordChangedAt field to timestamp. we divided it by 1000 to convert it to seconds because it will be in milliseconds and we specified it as base 10
    // JWTTimestamp is the timestamp the token was created/issued
    // changedTimestamp is the timestamp the password was changed
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // if Token was created/issued first before password is changed, it will be TRUE but if password was changed first before token is issued/created, it will be FALSE
    // false means not changed, true means changed
    return JWTTimestamp < changedTimestamp;
  }

  // False means password NOT changed. that is the Timestamp the token was issued is
  return false;
};

// THIS IS FOR THE FORGOTTEN PASSWORD
userSchema.methods.createPasswordResetToken = function () {
  // we will generate our token
  //the crypto is an in-built module. it will generate a randomBytes of 32 characters and then convert to a hexadecimal string
  const resetToken = crypto.randomBytes(32).toString("hex");

  // we will create a new field in our database(User table/collection) schema and store the hashed resetToken in that field
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // This resetToken will expire in 10 mins. the time the reset token is saved in this field
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // we will return the plain token because it will be the one that will be sent to the email
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
