const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel"); // we use this for emdedding
// const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal to 40 characters"],
      minlength: [10, "A tour name must have more or equal to 10 characters"]
      // validate: [validator.isAlpha, "Tour name must only contain characters"]
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"]
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult"
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10 // example 4.6666, 46.666, 47, 4.7 this seter function runs eat time a new value is set/added/updated in a field. we usually specify a callback function which receives the current value
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"]
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // we use the declarative function so that we will have access to the this keyword that point to the table
          // val is the priceDiscount that the user enters. we will get a true or false in the validation. if it's false, it will throw an error
          // the this keyword will not work when we try to update. this validator function will not work
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price"
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"]
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have an image cover"]
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    // we will embed everything related to the location in our tour model. mongoDB support goespatial data out of the box. Goespatial data is basically data that describes places on earth using longitude and latitude coordinates, we can describe simple points, we can also describe more complex geometrics like lines, or even polygons or even multi-polygons. Everything is possible with geospatial data in mongoDB. Remember, this is an embedded object and not a regular Tour schema type
    // The startLocation is not really a document itself. it's just an object describing a certain point on earth. In order to really create new documents and embed them into another document, we actually need to create an array
    startLocation: {
      // MongoDB uses a special data format called GeoJSON in order to specify geospatial data. Inside this object, we can specify a couple of properties and in order for this object to be recognise as geospatial JSON, we need the "type" and "coordinate" property
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number], // longitude first, then latitude. Normally, it is the other way round in most apps but that's how it works here
      address: String,
      description: String
    },

    // This is where we will embed the new documents. By specifying it as an array of object, this will now create brand new document inside of the parent document which is in this case the Tour
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number // this day will be the day of the tour in which people will go to this location
      }
    ],
    // This will contain the userId of the tour guides each time a tour is saved. this is done using "pre". This is for Embedding
    // guides: Array
    // This is for Referencing
    guides: [
      // this means the expected type for each of the element in the guides array should be a mongoDB Id
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// WE WILL SET AN INDEX FOR THE PRICE FIELD BECAUSE IT IS MOSTLY TO BE THE FIELD USERS WILL USED TO SORT/FILTER OFTEN
// 1 is sorting in ascending order, -1 is sorting in descending order
// this is a SINGLE field index
// tourSchema.index({price: 1})

// This is for a COMPOUND FIELD index
// the price will be sorted in ascending order and the ratingsAverage will be sorted in descending order
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" }); // we are telling mongoDB that the startLocation should be index to a 2d sphere. an earth like sphere where all our data are located

// the tour collection/table will have a durationWeeks field but it is not on the table but virtually
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// this will have an array of all the reviews of the tour but it is on a virtual field. the foreignField is the name of the field in the Review table/model we  want to get the tour reviews based on the tour ids
// the localField is the name of the fiekd in the Tour table what has the values that are stored in the Review tour fields (which is the tour ids)
// this will get all the data in the review table where the tour field (foreignField) contains the localField that related to that particulat tour _id (localField or primary key)
// Virtual populate.
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id"
});

// This is the mongoose middleware. the pre will run before an actual event
// this function will be called before an actual document is saved to the database
// DOCUMENT MIDDLEWARE: it runs before the .save()  and .create() command and not on .insertMany() and also for update. it works only for save and create
tourSchema.pre("save", function (next) {
  // we will create a slug for each of the document before it is saved. A slug is basically just a string that we can put in the URL usually base on some strings like the Tour "name"
  this.slug = slugify(this.name, { lower: true });
  next();
});

// FOR EMBEDDING
/*
// This will saved the Ids of the tour guides. This only works for creating new documents and not for updating them. This is when we want to use embedding
tourSchema.pre("save", async function (next) {
  // this is going to be an array of all the  user ids. for each interation, we will get the user record/document for the current id
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  // we need to use Promise.all() here because the result of all of the ids is a promise
  this.guides = await Promise.all(guidesPromises);

  next();
});

*/

/*
// we have have many pre save middleware/hook
tourSchema.pre("save", function (next) {
  console.log("Will save document...");
  next();
});

// This is a post middleware. This will run after the record has been saved. it has access to the record/doc that has been saved and also the next function
tourSchema.post("save", function (doc, next) {
  console.log(doc);
  next();
});

*/

// QUERY MIDDLEWARE
// This will point at the current query and not on the document. this will run if the event starts with "find"
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre("find", function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// This will select all the users whose ids are in the guides array from the User table/collection
// this is a QUERY middleware and the this keyword points to the current query
// the .populate() will select all the users whose ids are in the Tour table guides field. these users ids were referenced in the Tour table, so when we are selecting a tour, we will also select those users whose ids were referenced in that Tour guides field using .populate("guides") and specifying the field
// {path:"guides",select: "-_v -passwordChangedAt"} means we should not select the _v and passwordChangedAT fields
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-_v -passwordChangedAt"
  });

  next();
});

// This will run after the query has been executed. it will have access to all the records that is returned
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);

  next();
});

// AGGREGATION MIDDLEWARE
/*
tourSchema.pre("aggregate", function (next) {
  // the this will point to the aggregation object
  // we want to add at the beginning of the array that is why we use unshift()
  // this will be added to the aggregation to select/match only when the secretTour is not equal (ne) to true
  // this.pipeline() is an array that contains all the stages to be executed in an aggregation middleware


  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this);

  next();
});

*/

// THE CODE ABOVE, I RE-WROTE IT HERE TO ACCOMODATE THE $geoNear

tourSchema.pre("aggregate", function (next) {
  // Get the current aggregation pipeline stages
  const pipeline = this.pipeline();

  // Check if the first stage has "$geoNear"
  const firstStageHasGeoNear =
    pipeline.length > 0 && pipeline[0].hasOwnProperty("$geoNear");

  // Check if any stage has "$geoNear" and it's not the first one
  const hasGeoNearNotFirst = pipeline.some(
    (stage, index) => stage.hasOwnProperty("$geoNear") && index !== 0
  );

  // If there's a "$geoNear" stage not at the first position, skip adding $match
  if (hasGeoNearNotFirst) {
    return next(); // Skip adding $match if $geoNear is not the first stage
  }

  // Add $match stage to filter out secret tours
  if (!firstStageHasGeoNear) {
    pipeline.unshift({ $match: { secretTour: { $ne: true } } });
  }

  next(); // Proceed to the next middleware
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
