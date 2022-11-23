import Tour from "../models/tour.js"
import User from "../models/user.js"
import { catchAsync } from "../utils/catchAsync.js"
import AppError from "../utils/appError.js"
import Booking from "../models/booking.js"


export const alerts = (req, res, next) => {
  const {alert} = req.query // we destructure the alert variable from the query. We put alert on the query in our bookingcontroller in the successUrl when we create the checkout session
  if (alert === "booking")
    res.locals.alert = "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up immediately, please come back later."
    next()
}

export const getOverview = catchAsync(async(req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find()
    // 2) Build pug template

    // 3) Render that template using tour data from 1)
    res.status(200).render("overview", { // we render the overview.pug on route /overview and create local pug variable "title"
      title: "All Tours",
      tours
    })
})


export const getTour = catchAsync(async(req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: "reviews",
        fields: "review rating user"
    })
    if (!tour) {
      return next(new AppError("There is no tour with that name.", 404)) // we pass in the 2 parameter we declared in "appError.js". The error message we want to create and the statusCode
    }
    res.status(200)
    .render("tour", { // we render the overview.pug on route /overview and create local pug variable "title"
      title: `${tour.name} Tour`,
      tour
    })
  })


  // LOGIN
export const getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: "Log into your account"
    })
}

// See your account
export const getAccount = (req, res) => {
    res.status(200).render('account', { // we render the pug template "account.pug" with local variable title, user (we saved the currentUser in "protect" middleware on the req.user = currentUser and res.locals.user = currentUser) So we have access in our pug templates to the current Users data.
      title: "Your account"
  })
}

// See current users booked tours
export const getMyTours = catchAsync(async(req, res) => {
  // 1) find all bookings
  const bookings = await Booking.find({user: req.user.id}) // this finds alls the bookings of a user by his ID
  // 2) find tours with the returned IDs
  const tourIDs = bookings.map(item => item.tour.id) // this will store all the tourIds which the user purchased inside an array. (the tour ids are stored in every booking document inside the tour field)
  const tours = await Tour.find({_id: {$in: tourIDs}}) // will select all the tours documents which have an ID in our DB which is also inside tourIDs array.

  res.status(200).render("overview", {  // rendering our pug template overview.pug to the client. But just with the tours, which the user booked in the past.
    title: "My Tours",
    tours
  })
})


export const updateUserData = catchAsync(async(req, res, next) => {
  console.log("UPDATING USER",req.body);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  )

  res.status(200).render('account', {
    title: "Your Account",
    user: updatedUser
  })
})