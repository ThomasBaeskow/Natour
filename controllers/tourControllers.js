import Tour from '../models/tour.js';
// import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { factoryCreateOne, factoryDeleteOne, factoryGetAll, factoryGetOne, factoryUpdateOne } from "./handlerFactory.js"
import multer from "multer"
import sharp from "sharp"


const multerStorage = multer.memoryStorage()

// BUILT OPTION FOR FILTER
// MULTER FILTER
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) { // we are checking, if value of mimetype property starts with "image". Means if a image gets uploaded ==> no error
    cb(null, true)
  } else { // if its no image ==> error!
    cb(new AppError("Not an image! Please upload only images.", 400), false) // we need t pass in false as second parameter
  }
}

// PASS IN MULTER OPTIONS INTO multer() function:
const upload = multer({ // thats the path to the folder, where we want to save the images, uploaded by the form. We pass in an configuration object. We upload images into our filesystem and put a link into the DB to the images
  storage: multerStorage,
  fileFilter: multerFilter
}) 

export const uploadTourImages = upload.fields([ // we want to upload multiple files to multiple fields. we use "fields()"
  {name: "imageCover", maxCount: 1},
  {name: "images", maxCount: 3}
])
// upload.single("image") // if we want to upload a single file ==> req.file
// upload.array("images", 5)  // if we would just want to upload multiple files to one field, we would do it like that. first parameter is name of the field and secod the maxCount (amount) of files we want to upload ==> req.files

export const resizeTourImages = catchAsync(async(req, res, next) => { // here we process the image files and save them to the disc (filesystem)
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next()
  
  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/tours/${req.body.imageCover}`) // sharp is a image processing library (package) for resizing images in a simple way. We pass into sharp() the name of the file we want to resize. It gives back an object, where we can use JS methods on for resizing. "resize(500, 500)" (width, height) is resizing the image to a square, all the image files will have the format "jpeg". jpeg method compresses the image quality to 90% that it wont take too much space. toFile() needs the path to the file and want to save this to the file in our fileSystem.

  // 2) Images
  req.body.images = [] // creating an empty array on req.body.images
  await Promise.all(req.files.images.map(async(item, i) => { // Promise.all() awaits all of the file processing which are promises.
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
    await sharp(item.buffer).resize(2000, 1333).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/tours/${filename}`)
    req.body.images.push(filename) // we push all the files which are stored on req.files.images inside our empty array in req.body.images
    })
  )
  next()
})


// ALIASING : we can manipulate the req.query object before we will use it in getAllTours
export const aliasTopTours = (req, res, next) => {
  req.query.limit = "5"
  req.query.sort = "-ratingsAverage,price"
  req.query.fields = "name,price,ratingsAverage,summary,difficulty"
  next()
}

// AGGREGATION PIPELINE: (using aggregation operators like $match, $group, etc)
export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {ratingsAverage: {$gte: 4.5}}
    },
    {
      $group: {
        // _id: "$difficulty",
        // _id: "$ratingsAverage",
        _id: {$toUpper: "$difficulty"},
        numTours: {$sum: 1},
        numRating: {$sum: "$ratingsQuantity"},
        avgRating: {$avg: "$ratingsAverage"},
        avgPrice: {$avg: "$price"},
        minPrice: {$min: "$price"},
        maxPrice: {$max: "$price"},
      }
    },
    {
      $sort: {avgPrice: 1} // 1 for ascending price
    }
    // {
    //   $match: {_id: {$ne: "EASY"}} // excluding "easy" data.
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    },
  });
})
// ANOTHER AGGREGATION PIPELINE (for analyzing tours in 2021)
export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1 // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates" // this is creating for every object inside startDate field a document. every Tour got 3 startDates ==> it creates 3 documents for every Tour.
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
        _id: {$month: "$startDates"},
        numTourStarts: {$sum: 1},
        tours: {$push: "$name"} // push is creating an array out of the field "name" values, which are matching the conditions (between january 2021 and december 2021)
      }
    },
    {
      $addFields: {month: "$_id"} // addFields operator is adding the field "month"
    },
    {
      $project: { // project is deleting the field "_id". if we put a "1" it would show up
        _id: 0
      }
    },
    {
      $sort: {numTourStarts: -1} // descending order
    },
    {
      $limit: 12 // its limiting the output to 12
    }

  ])
  res.status(200).json({
    status: 'success',
    result: plan.length,
    data: {
      plan
    },
  });
})


// Controllers with factory functions:
export const getAllTours = factoryGetAll(Tour)
// catchAsync(async (req, res, next) => {
//     console.log(req.query);
//     // EXECUTE QUERY: here we can just delete one of the methods if we dont want to apply them.
//     const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate()

//     const tours = await features.query

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length, // just do this if you read an array with multiple objects inside.
//       data: {
//         tours
//       },
//     });
// });

export const getTour = factoryGetOne(Tour, {path: "reviews"})
// catchAsync(async (req, res, next) => {
//     // const id = req.params.id * 1; // this is a trick which converts automatically a string to a number, when it gets multiplied with a number.
//   // const tour = tours.filter((item) => item.id === id); // filters the object with the fitting id property from the array and returns it.
//     const tour = await Tour.findById(req.params.id).populate("reviews")
   
//     if (!tour) { // if tour is false. means tour value "null" is not a truthy value. --> false
//       return next(new AppError("No tour found with that ID", 404)) // we need return, because we want to end the circle and not res.status(responding) the tour with false ID to the client. (user)
//     }

//   // we read this object with the fitting id to the client.
//     res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     },
//   });
// })

// // CATCHING ERRORS IN ASYNC FUNCTIONS: --> we import it from "./utils/catchAsync.js"
// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next) // this allows us to forehand our error which will happen in our promis toour global error handling middleware. We can get rid of the "try/catch" block in createTour. Async functions return promises, where the catch method can be used.
//   }
// }

export const createTour = factoryCreateOne(Tour)
// catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body) // this is shorthand for belows code
//     // const tour = req.body
//     // const newTour = new Tour(tour)
//     // await newTour.save()
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//     },
//     })
// }) 

export const updateTour = factoryUpdateOne(Tour)
// catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     })

//     if (!tour) { // if tour is false. means tour value "null" is not a truthy value. --> false
//       return next(new AppError("No tour found with that ID", 404)) // we need return, because we want to end the circle and not udating th tour with wrong ID given by user
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour
//       },
//     });
// });


export const deleteTour = factoryDeleteOne(Tour) // we created a factory for deleting documents in a model. We can apply that into every controller, where we want to delete something.
// export const deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id)

//     if (!tour) { // if tour is false. means tour value "null" is not a truthy value. --> false
//       return next(new AppError("No tour found with that ID", 404)) // we need return, because we want to end the circle and not res.status(responding) the tour with false ID to the client. (user)
//     }

//     res.status(204).json({
//       // statuscode 204 = no content
//       status: 'success',
//       data: null,
//     });
// });



// "/tours-within/:distance/center/:latlng/unit/:unit" 
// "tours-distance/233/center/34.121403,-118.123376/unit/mi"
export const getTourWithin = catchAsync(async(req, res, next) => {
  const {distance, latlng, unit} = req.params
  const [lat, lng] = latlng.split(",") // we split our string and save the strings wth destructering in lat and lng variables. (34.121403,-118.123376)

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1 // mongoDB is assuming we give the radius of the sphere in radiants. 3963.2 is the radius of he earth in miles. in km its 6378.1

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude n the format lat,lng.", 400))
  }

  const tours = await Tour.find({
    startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}} // "$geoWithin" is a geospatial Operator. We need an index for our startLocation in our Tour Model
  }) 


  // console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours
    }
  })
})

export const getDistances = catchAsync(async(req, res, next) => {
  const {latlng, unit} = req.params
  const [lat, lng] = latlng.split(",") 

  const multiplier = unit === "mi" ? 0.000621371 : 0.001 // converting meters to miles or km (distances)

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude n the format lat,lng.", 400))
  }

  const distances = await Tour.aggregate([ // we pass in an array with all the stages we want to define in our aggregation pipeline. The ONLY existing geospatial aggregation pipeline stage which exists is "$geoNear" !!! It needs to be the first stage! It requires that at least one of her fields contain a geospatial index (our "startLocation" field --> "2dsphere"). geoNear operator will automatically use that index for calculation.
    {
      $geoNear: { // geoNear oprator is calculating the distance from a starting point to another point. We store the calculated distance in the distanceField which we create in our aggregation pipeline.
        near: {
          type: "Point",
          coordinates: [lng *1, lat * 1] // * 1 to convert to numbers
        },
        distanceField: "distance", // this is the field which gets created, where all the calculated distances will be stored
        distanceMultiplier: multiplier  // this number gets multiplied with all the calculated distances. * 0.001 means converting meters to km
      }
    },
    {
      $project: { // Projection stage --> we just want to see our fields "distance and name"
        distance: 1,
        name: 1
      }
    }
])

  res.status(200).json({
    status: "success",
    data: {
      data: distances
    }
  })
})