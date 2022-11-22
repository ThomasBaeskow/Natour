import mongoose from "mongoose"
import slugify from "slugify"
// import validator from "validator"
// import User from "./user.js"

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        maxlength: [40, "A tour name must have less or equal then 40 characters"],
        minlength: [10, "A tour name must have more or equal then 10 characters"]
        // validate: [validator.isAlpha, "Tour name must only contain characters"] // check documentation "validation github". Here we use the validator which we need to install and import
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
        values: ["easy","medium","difficult"],
        message: "Difficulty is either easy, medium, difficult"
      }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be above 1.0"],
        max: [5, "Rating must be below 5.0"],
        set: val => Math.round(val * 10) / 10 // the set functions runs every time there is a new value for the ratingsAverage field. (this happens by creating, updating, deleting reviews and tours.) It rounds the number from 4.66666666 to 4.7
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
      // custom validator
      validate: {
        validator: function(val) {
          return val < this.price // priceDiscount = 100 and the price is 200 ==> true. "this" only points to current doc on NEW document creation
        },
        message: "Discount price ({VALUE}) should be below regular price",
      }
    },
    summary: {
      type: String,
      trim: true, // will remove all the white place in the end und beginning when the user is typing in
      required: [true, "A tour must have a description"]
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false // we can exclude fields in the model Schema like this
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    // EMBEDDED/DENORMALIZED DATA SET
    // adding startLocation as a subfield - This is the way to go. At least 2 fields with type and coordinates
    startLocation: { // these subfields have the same structure like in the tours.json
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    //adding locations as a subfield
    locations: [ // specification of array of objects will create new Documents inside of the parent Document which is tour. Inside the field locations
      {
        type: { // field names are the same as in the tours.json which we will import in our DB
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array - (embedded)
    guides: [ // this is Parent referencing. Output wont be the whole user with the id. It will be just an array of id´s
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
    // this would be child referencing what we dont want. Cause the array of reviews can grow uncontrollable.
    // reviews: [
    //   {type: mongoose.Schema.ObjectId,
    //   ref: "Review"}
    // ]
  },
  {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
  }
)

// tourSchema.index({price: 1}) // 1 stands for ascending order -1 for descending order. This helps our reading performance and our application has a better performance. for fields like name or id, mongoose is creating an index on default. You can see it in compass (index). You put Indexes on fields, where you think the most users will query for. Your application doesnt have to read all the data because of the descending/ascending order from the index.
tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: "2dsphere"}) // startLocation is indexed now to a "2dsphere"
// defining virtual properties which are not stored in the Database.
tourSchema.virtual("durationWeeks").get(function() {
  return this.duration / 7 
})

// VIRTUAL POPULATE
// We are implementing a kind of child referencing with creating virtual fields. Thats how we not store the Array of reviews in our DB,but still have the connection to it.
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", // "tour" is the field in Review model where we implemented the Parent Referencing to the Tour model
  localField: "_id" // "_id" is called "tour" in the Review model. Thats how we build the connection between Review and Tour
})

// Mongoose Middleware (1.Document middleware, 2.Query middleware, 3.Aggregate middleware)
// DOCUMENT MIDDLEWARE: this function will be called before a document will be saved to the Database (.save() .create())
// in "this" we have access to the current document which is processed
// "save" is called "hook" and the whole middleware is called "pre save hook"
tourSchema.pre("save", function(next) {
  // console.log(this);
  this.slug = slugify(this.name, {lower: true}) // slug creates a string based of the current processed documents "name" field. We use this in our pug template "overview.pug" for rendering a tour page for specific tour. The slug is integrated in our route ==> a.btn.btn--green.btn--small(href=`/tours/${item.slug}`) Details. Looks in url like ==> http://127.0.0.1:3000/tours/the-sea-explorer
  next()
})

// pre save middleware for updating the field guides, which is an Array in tour models subfield guides (embedded)
// tourSchema.pre("save", async function(next) {
//   const guidesPromises = this.guides.map(async item => await User.findById(item)) // guides = [id, id, id, ...]
//   this.guides = await Promise.all(guidesPromises) // Promise.all(guidesPromises) convert the Promises
//   next()
// })

// QUERY MIDDLEWARE: "pre find hook". Middleware which runs before any "find()" query is executed. Here we have access to the current query-object and not the current document with using "this"!
tourSchema.pre(/^find/, function(next) { // this regular expression targets all strings which are start with "find". We do this because in our middleware, where we want to findByID we use the "findOne" method. When we use this we dont want to find our secret Tour. This regular expression includes the findOn method.
  // tourSchema.pre("find", function(next) {
  this.find({secretTour: {$ne: true}})
  this.start = Date.now()
  next()
})

// middleware for manipulating query before find() executes.
tourSchema.pre(/^find/, function(next) {
  this.populate({ // populate(fieldName) // we fill the field guide with the actual data instead of just showing the id of the users. we replace the id with the users data.
    path: "guides", // field we want to update
    select: "-__v -passwordChangedAt" // which fields we want to exclude
  })
  next()
})

// the post query (find) middleware runs after the query is executed. thats why it has access to the processed documents of the query
// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   // console.log(docs);
//   next()
// })

// AGGREGATION MIDDLEWARE -  "this" points to the current aggregation-object -  We get rid of this middleware because our "$geoNear" has to be he first stage in aggregation pipeline!
// tourSchema.pre("aggregate", function(next) {
//   this.pipeline().unshift({$match: {secretTour: {$ne: true}}}) // unshift is adding an element at the beginning of an array. We add another stage (condition)'$match': { secretTour: [Object] } to our aggregate-object which you can see in console.log(this.pipeline).  {$match: {secretTour: {$ne: true}}} removes all the documents where secretTour is set to "true". This means it excludes our secretTour in our aggregation pipeline.
//   console.log(this.pipeline());
//   next()
// })

// creating a Model out of it: Model variables always wih capital Letter.
const Tour = mongoose.model("Tour",tourSchema)

export default Tour