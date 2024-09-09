// this is to handle multi-part/formdata (images)
const multer = require("multer");
// sharp is an image processing library in node js. Good at resizing images
const sharp = require("sharp");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// we will create one multer storage and one multer filter. we will use the storage and filter to then create the upload
// we can also choose to store the file in memory as a buffer so that we can use it later by other processes but we will do that later but for nowm we will store the file as it is in our file system

// the callback() function (cb) is like the next() function in express.but it is not a next() function , it just works like the next() function. in the cb() function, the first argument is an err if there is one, if not, we will parse null. the second argument is the actual destination
// the req,file or file is like this
/*
  {
    fieldname: 'photo',
    originalname: 'leo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: 'public/img/users',
    filename: 'c96c4a362e17567d5597de2ae5019acd'
  }
*/
// because we are using sharp to resize the image, we will now have to save the image in memory
/*
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    // we will give our files a unique filename ( user-id-currentTimestamp ) e.g user-67736536646bdydbgey47-5563535353.jpeg
    // we will extract the filename form the upload file
    // the current / logged in user is attached to the request (req), so we will get the user.id from there
    // we will rename our image and it will be upladed to the destination above public/img/users
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});
*/
// the image will now be stored as a buffer (because it is stored in memory). we store the image in memory so that we can do further processing, that is, we can still do more processing on the image before we upload it. if we do not want to process the image further, we can use the method above and just upload it
const multerStorage = multer.memoryStorage();

// This function, the goal is basically to test if the uploaded file is an image and if it's an image, we will parse TRUE in the  callback function and if it's not, we wil parse FALSE in the callback function along with an error. we don't want files that are not an image to be uploaded
// if we want to upload something else like pdf, docx, csv files, we will check for them
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    // if there is an image, we will parse true in the callback function
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

// const upload = multer({ dest: "public/img/users" });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// we will create the image middleware
// we use .single('photo') in the upload because we want to upload only one image at a time and we parse the name of the field in the User table that will hold the uploaded image (which is the url of the image we will upload)
// the upload middleware will add/attach information about the file to the request (req) object
// the "photo" in the upload.single("photo") is the name of the input from the image form we are uploading "CORRECT"
exports.uploadUserPhoto = upload.single("photo");

// THIS WILL RESIZE THE IMAGE
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // if no image was uploaded, we will just go on to the next middleware
  if (!req.file) return next();

  // we will rename our image name here. we will not add the image extention because the sharp will make it to be a jpeg. so we will just add the .jpeg
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // we will use he sharp package to resize it. install it using npm i sharp
  // when doing image processing, right after uploading the file, it is always best to not even  save the file to the disk but instead to save it to memory. we will get the image now from the memory buffer
  // calling the sharp() method like this will then create an object which we can chain muliple methods in order to do the image processing
  // then we will now write the file to a path to our disk
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  // we will call the next middleware
  next();
});

// THIS FUNCTION WILL FILTER OUT FIELDS WE DON'T WANT
const filterObj = (obj, ...allowedFields) => {
  // we will loop through the obj and filter out the keys/fields that are not in the array (allowedFields). it will be an array now because of the spread syntax
  // Object.keys will return an array containing all the keys/fields in the object/formData
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    // if the object key is included in the allowedFields, assign that obj key to the obj value for that same key in the newObj
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  // then return the newObj
  return newObj;
};

// This is will assign the logged in user id as the parameter id
exports.getMe = (req, res, next) => {
  // the user.id is coming from the logged in user data/details we attached to the request (req) in the protect middleware
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
/*
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users
    }
  });
});
*/

// THE CURRENT LOGGED IN USER WILL UPDATE HIMSELF
exports.updateMe = catchAsync(async (req, res, next) => {
  // the bodyParse() will not be able to handle files, so that is why we are using the multer()
  // this will hold information about the image we want to upload
  // console.log(req.file)
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password update. Please use /updateMyPassword",
        400
      )
    );
  }

  // 2) Filter out unwanted fields that are not allowed to be updated
  // we want the user to update only the name and email field. so, we will filter out other fields the user wants to update
  const filteredBody = filterObj(req.body, "name", "email");

  // we will add the photo to the filterObject (or body was an to update) if there is a file
  // before now, we have already stored the image to the destination in public/img/users in the upload middleware. filename is the new name of the file we have changed it to be or renamed it to be. photo is the name of the field to save the user image in the User table
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document/record
  // the req.user.id is coming from the logged in user data/details attached to the req after we pass the authController.protect middleware
  //  Here, we will use findByIdAndUpdate() because if we use the .save() method, the password validation field will run and we will get an error because we are not dealing with password in this case
  // the new: true, will return the updated user document/data/record and the rnValidators: true, will allow our database/user model table to validate the only the field we want to update/parse
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

// THE CURRENT USER CAN DELETE HIS ACCOUNT BY SETTING THE ACTIVE TO FALSE IN THE USER TABLE
exports.deleteMe = catchAsync(async (req, res, next) => {
  // req.user.id is from the authConroller.protect middleware. we attached user data/details to the request (req)
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined"
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined! Please use/ signup route instead"
  });
};

exports.getUser = factory.getOne(User);

// ONLY THE ADMIN CAN UPDATE THE USER
// NOTE: Do not update password with update() instead use save() so that the password will be validated and encrypted
exports.updateUser = factory.updateOne(User);
// ONLY THE ADMIN CAN DELETE THE USER
exports.deleteUser = factory.deleteOne(User);
