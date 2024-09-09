const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null
    });
    /*} catch (err) {
        res.status(400).json({
          status: "fail",
          message: err
        });
      }*/
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // try {
    // the new: true, makes the updated record to be returned. the runValidators: true, make the table/model to validate the input data before it is stored in the table
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      // the next will make it go to the next middleware
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc
      }
    });
    /*} catch (err) {
      res.status(404).json({
        status: "fail",
        message: err
      });
    }
    */
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // try {
    // old way to save document diurectly on the table
    // const newTour = new Tour({});
    // newTour.save();

    // New Way
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc
      }
    });
    /*} catch (err) {
      console.log(err);
      res.status(400).json({
        status: "fail",
        message: "Invalid data sent!"
      });
    }
      */
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // we will create a wuery. if there is a populate() option, we will add it to the query
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // TO ALLOW FOR NESTEd GET reviews routes on tour (hack)
    // if the route has an tourId parameter, we will find/get the review of that particular tour base on the tourId
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // if there is no tourId, the filter will be an empty object. In that case, we will find all the review
    // the filter is only for nested route for  review on tour

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        data: docs
      }
    });
    /*} catch (err) {
    res.status(404).json({
      status: "fail",
      message: err
    });
  }*/
  });
