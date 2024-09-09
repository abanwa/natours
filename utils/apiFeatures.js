class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields"];
    // delete the records in the object that has any of the keys in the excludeField array
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) Advance Filtering

    // Convert string values to numbers where applicable
    // we will convert the string to Number
    // for (const key in queryObj) {
    //   if (queryObj[key].gte) {
    //     queryObj[key].gte = Number(queryObj[key].gte);
    //   }
    // }

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      // console.log("sortBy", sortBy);
      this.query = this.query.sort(sortBy);
      // sort("price ratingsAverage")
    } else {
      // minus (-) in front of the sortung means it should be in the descending order
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      // fields will be "name duration price"
      this.query = this.query.select(fields);
    } else {
      // the minus (-) infront of the fields in the select() means to exclude the fields specified there
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    // we need to get the page and the limit from the query string
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // skip is the amount of results that should be skipped before querying data
    // page=2&limit=10,   1-10, page 1, 11-20, page 2, 21-30, page 3

    // we need to skip 10 results to get result in number 11 and result no 11 is in page 2
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
