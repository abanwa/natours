// const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// the image will now be stored as a buffer (because it is stored in memory). we store the image in memory so that we can do further processing, that is, we can still do more processing on the image before we upload it. if we do not want to process the image further, we can use the method above (in userController, i wrote the method there) and just upload it
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

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// we will upload multiple images to different field/columns. 1 image will be upload/insert to imageCover while the images field will hold 3 images
exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 }
]);

/*
// if it's just one image, we will do it like this
upload.single("image") // this will be req.file
// if it was only one field we want to uplaod the images to . we will just do it like this.  "images" will be the table field/column name and 5 will be the maximum number of iumages we can upload
upload.array("images", 5) // this will be req.files
*/

// This will process the tour images we saved to memory as we upload them before they will finally be uploaded
// we actually need to make it possible that our updateTour handler picks up this image cover filename and update it in the current tour document/record in our Tour table
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1)  Process the cover image
  // the req.params.id is coming from the request because this request will be for s unique tour base on the id in the param request/url
  // NOTE: the updateOne() takes in the entire body of the form (req.body), so we will attached the cover image filename to the req.body
  // so, the req.body that we will update in the updatetour middleware will have the imageCover attached to the req.body to update
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) process the images
  // the images is an array of more than one image. so we will process them using a loop
  // "i" is the current index of the file we ae looping in the images array.
  req.body.images = [];
  // since this is an async function for each of the loops, it will return a new promise. so we will use map() to get all the arrays of the promise. Then we will use promise.all() to await all of them. so that the next() function will be called after all the promises have been fulfilled or the function has finished running
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // we will create the current filename here
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  // this will call/go to the next middleware
  next();
});

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

exports.getAllTours = factory.getAll(Tour);

// Thjis is the getALlTour before we refactor it. so, we are using the one above now
exports.getAllToursOld = catchAsync(async (req, res, next) => {
  // try {
  // BUILD THE QUERY
  // we will create a hard copy of the req.query object
  // 1A) Filtering
  /*
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    // delete the records in the object that has any of the keys in the excludeField array
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) Advance Filtering
    // console.log(req.query, queryObj);

    let queryStr = JSON.stringify(queryObj);
    

    // we want to find one of these four words (gte, gt, lte, lt) and replace it with the same word but with dollar sign in front
    // {difficulty: 'easy', duration: {$gte: 5}}
    queryStr = queryStr.replace(/\b(get|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // This is to get all without any filter
    // const tours = await Tour.find();
    // to filter/search. first we can use a filter object
    // console.log(req.query);

    // {difficulty: 'easy', duration: {$gte: 5}}

    let query = Tour.find(JSON.parse(queryStr));

  */

  // 2) Sorting
  /*
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
      // sort("price ratingsAverage")
    } else {
      // minus (-) in front of the sortung means it should be in the descending order
      query = query.sort("-createdAt");
    }
      */

  // 3) Field Limiting
  /*
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      // fields will be "name duration price"
      query = query.select(fields);
    } else {
      // the minus (-) infront of the fields in the select() means to exclude the fields specified there
      query = query.select("-__v");
    }

    */

  // 4) Pagination

  /*
    // we need to get the page and the limit from the query string
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // skip is the amount of results that should be skipped before querying data
    // page=2&limit=10,   1-10, page 1, 11-20, page 2, 21-30, page 3

    // we need to skip 10 results to get result in number 11 and result no 11 is in page 2
    query = query.skip(skip).limit(limit);

    // This is when we try to go to more pages or get more records that are not in our table
    if (req.query.page) {
      // count all the number of data/records in the Tour table
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error("This page does not exist");
    }

    */

  // There, we will use some special mongoose method to filter or search
  /*
    const query = Tour.find()
      .where("duration")
      .equals(5)
      .where("difficulty")
      .equals("easy");
      */

  // EXECUTE THE QUERY
  // this is how the query will look like at the end of the day
  // query.sort().select().skip().limit()

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours
    }
  });
  /*} catch (err) {
    res.status(404).json({
      status: "fail",
      message: err
    });
  }*/
});

exports.getTour = factory.getOne(Tour, { path: "reviews" });
/*
exports.getTour = catchAsync(async (req, res, next) => {
  // try {
  // the .populate() will select all the users whose ids are in the Tour table guides field. these users ids were referenced in the Tour table, so when we are selecting a tour, we will also select those users whose ids were referenced in that Tour guides field using .populate("guides") and specifying the field
  // {path:"guides",select: "-_v -passwordChangedAt"} means we should not select the _v and passwordChangedAT fields
  // we will run this code in the tourSchema model
  // we only want to populate the reviews from the tour field in the Review table/Model for this particular tour when we try to get one tour
  const tour = await Tour.findById(req.params.id).populate("reviews");
  // Tour.findOne({_id: req.params.id})

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  });
  //} catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err
  //   });
  // }
  // const tour = tours.find((el) => el.id === id);
});

*/

exports.createTour = factory.createOne(Tour);
/*
exports.createTour = catchAsync(async (req, res, next) => {
  // try {
  // old way to save document diurectly on the table
  // const newTour = new Tour({});
  // newTour.save();

  // New Way
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour
    }
  });
  //} catch (err) {
  //   console.log(err);
  //   res.status(400).json({
  //     status: "fail",
  //     message: "Invalid data sent!"
  //   });
  // }
    
});

*/

exports.updateTour = factory.updateOne(Tour);
/*
exports.updateTour = catchAsync(async (req, res, next) => {
  // try {
  // the new: true, makes the updated record to be returned. the runValidators: true, make the table/model to validate the input data before it is stored in the table
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    // the next will make it go to the next middleware
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  });

  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err
  //   });
  // }
});

*/

exports.deleteTour = factory.deleteOne(Tour);
/*
exports.deleteTour = catchAsync(async (req, res, next) => {
  // try {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });

  // } catch (err) {
  //   res.status(400).json({
  //     status: "fail",
  //     message: err
  //   });
  // }
});

*/

exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: "$difficulty",
        _id: { $toUpper: "$difficulty" },
        // _id: "$ratingsAverage",
        // _id: null,
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      // for sorting, 1 is for ascending
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: "EASY" } }
    // }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats
    }
  });
  /*} catch (err) {
    res.status(404).json({
      status: "fail",
      message: err
    });
  }*/
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      // to unwind, each date in the startDate array will be a single document base on that date in the startDate
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        // what we define in the _id is used to group our document/table. the $month will be extracted from the date
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" }
      }
    },
    {
      // we will add a field. the field name will be month and the value will be the value of the _id
      $addFields: { month: "$_id" }
    },
    {
      // we want to remove the _id field as we add already added a new field called month which has the values that is the same as the id. since we give the _id: 0, it will be hidden but if it was 1, it would show
      $project: {
        _id: 0
      }
    },
    {
      // this will sort the results base on the value of the numTourStarts in the descending order because of the -1 (negative sign)
      $sort: { numTourStarts: -1 }
    },
    {
      // this will allow us to have only 12 output
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan
    }
  });
  /*} catch (err) {
    res.status(404).json({
      status: "fail",
      message: err
    });
  }*/
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  // to get the radius, we need to divide the distance by the radius of the earth
  // the radius of the earth in miles is 3963.2mi
  // the radius of the earth in kilometers is 6378.1km
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  // we will get our coordinate from latlng
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400
      )
    );
  }

  // NOTE: geoSpatial query also works similar like a regular query
  // we will specify our filter object. Remember, we want to basically query for the startLocation because The startLocation field is what holds the geoSpatial point where each tour starts.  we will use a geo special operator which find documents within a certain geometry and we will define/parse the grometry. we want to find document which starts at the lat and lng we parsed within a radius of the distance we parsed. the centerSphere operator takes in an array of the coordinates and then the radius. the radius id our distance but converted to radians
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours
    }
  });
});

// This will calculate all the distances of each of the tour within a certain point
exports.getDistances = catchAsync(async (req, res, next) => {
  // we will use the aggregate pipeline
  const { latlng, unit } = req.params;

  // we will get our coordinate from latlng
  const [lat, lng] = latlng.split(",");

  // 1 meter in miles is 0.000621371
  // 1 meter in kilometer is 0.001;
  const muliplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400
      )
    );
  }

  // to do the calculation, we will use the aggregation pipeline. we parse in an array with all the stages of the aggregate pipeline we want to define
  // $geoNear always need to be the first stage. ALso NOTE that geoNear also requires that atleast one of our fields contains a geoSpatial index. In our case, our startLocation already has the geoSpatial index that de set for it in the TourModel "2dsphere". The $geoNear will use that field in order to perform the calculation. if there are multiple fields with geoSpatial indexes, then we will use the key parameter in order to define the field we want to use for that calculation.
  // we multiplied the lng and lat by 1 in order to convert them to a number
  // the distanceField is the field that will be created where all the calculated distances will be stored
  // we want to convert the distance from meter to kilometer because the result will come in meter. we use the distnaceMultiplier and multiple the distance by 0.001 which is the same as dividing by 1000

  // for the second stage which is the project, we want to only get the distances and the name of the tour
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: muliplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances
    }
  });
});
