import mongoose from "mongoose"
import Tour from "./tour.js"

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, "A review can not be empty"],
        trim: true
      },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // PARENT REFERENCING
    tour: { // now every Review knows for which tour document this review is for. 
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, "Review must belong to a tour"]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Review must belong to a user"]
    }
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
)

// a user can write a review for a specific tour just once:
reviewSchema.index({tour: 1, user: 1}, {unique: true}) // this means each combination of user and tour field in a review, must be unique!


// middleware for manipulating query before find() executes.
// we dont want to populate the tour in the reviews, thats why we delete it from "path: user tour". Now we will just see the id of the tour. But not the whole tour populated.
reviewSchema.pre(/^find/, function(next) {
    this.populate({ // populate(fieldName) // we fill the field guide with the actual data instead of just showing the id of the users. we replace the id with the users data.
      path: "user", // field we want to update
      select: "name photo" // which fields we want to include
    })
    next()
  })

// STATIC METHOD - refers to the model. INSTANCE Methods refer to the current document.
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {tour:tourId} // // 1. match stage
    },
    {
      $group: {             // 2. group stage
        _id: "$tour",       // (fields like: _id:"$tour") will group the documents filtered by the tour field which we created in the match stage Or which we have in our Review Model. the field holds all the document ids.
        nRating: {$sum: 1},  // number of ratings. "sum" is an operator.  "sum:1" means we are adding +1 for every document which matches the tourId. 5 reviewed documents means 5 as number of ratings.
        avgRating: {$avg: "$rating"} // avg is a operator which applies on the values of the "rating" field inside our "Review" Model an average calculation.
      }
    }
  ]) // "this" points to the model. "Review.aggregate()"  (aggregate just works on Models.)
  // console.log(stats);

  if (stats.length > 0) { // if we find in our review DB collection a document (review) with the field tour and value of the tourId (the id of the tours document).
    // we are updating our fields "ratingsQuantity" and "ratingsAverage" in our "Review" Model after a Document got saved.
  await Tour.findByIdAndUpdate(tourId, { // first parameter is the id for which we are searching in our "Tour" Collection. second is the Object which updates the fields.
    ratingsQuantity: stats[0].nRating, // index 0 (stats[0]) is the object which holds _id, nRating and avgRating as properties.
    ratingsAverage: stats[0].avgRating
  })
  } else { // when we have no documents in our DB Review Collection which are matching the tourId, we set amount of ratings to 0 and average on default to 4.5, because there are no reviews for the tour anymore!
    await Tour.findByIdAndUpdate(tourId, { 
      ratingsQuantity: 0, 
      ratingsAverage: 4.5
    })
  }
}

// Now we want to call "calcAverageRating()" every time a review document gets saved. We calculate the average of all the reviews ratings.
reviewSchema.post("save", function() { // post middleware has no access to next()
  // this points to current document (review)
  this.constructor.calcAverageRatings(this.tour) // "this.tour" means we pass in the id of the current tour for which the review is for. The constructor stands for the "review Model" where the "calcAverageRatings()" is stored
})

// findByIdAndUpdate
// findByIdAndDelete
// reviewSchema.pre(/^findOneAnd/, async function(next) { // pre middleware has access to next()
//   this.r = await this.findOne() // we can execute the query, which will use the "review" document which we going to process. We create a property inside our this variable and store the review document inside
//   console.log(this.r);
// })

// reviewSchema.post(/^findOneAnd/, async function(next) { 
//   // await this.findOne() does NOT work here, query has already executed
//   await this.r.constructor.calcAverageRatings(this.r.tour) // "this.r.tour" is the tour id. "r"is the whole review document.
// })

reviewSchema.post(/^findOneAnd/, async function(doc) {
  await doc.constructor.calcAverageRatings(doc.tour)
})

// creating a Model out of it: Model variables always wih capital Letter.
const Review = mongoose.model("Review",reviewSchema)



export default Review

// POST /tour/234fsa/reviews => nested route
// GET /tour/234fsa/reviews
// POST /tour/234fsa/reviews/9784cdcdc