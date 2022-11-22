import Tour from '../models/tour.js';
import { catchAsync } from '../utils/catchAsync.js';
import { factoryCreateOne, factoryDeleteOne, factoryGetAll, factoryGetOne, factoryUpdateOne } from "./handlerFactory.js"
import Stripe from "stripe"
import dotenv from "dotenv"
import Booking from "../models/booking.js"
import User from "../models/user.js"

dotenv.config({ path: './config.env' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)




export const getCheckoutSession = catchAsync(async(req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId)

    // 2) Create checkout session
    // all the following fields are declared by the stripe package. We cannot make our own names.
    const session = await stripe.checkout.sessions.create({
        // 1) first part is for information about the session itself
        mode: "payment", // single payment, no subscription
        // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, // user gets redirected to this url after paying successful. WE STORE tourId, userId and tour price to req.query object.
        success_url: `${req.protocol}://${req.get("host")}/my-tours`,
        cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`, // user gets redirected to this url when canceling payment
        payment_method_types: ["card"], // payment methods
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, // product id (tour) of the purchase which creates access to the tour document
        // 2) second part is the information about the product which is the user about to purchase.
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: tour.price * 100, // price of the purchased product. multiplied by 100 cause we need to convert it to cents. stripe stuff.
                    product_data: {
                        name: `${tour.name} Tour`, // product name
                        images: [`${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`],
                    }
                },
                quantity: 1
            }
        ],
    }
    )

    // 3) Create session as response
    res.status(200).json({
        status: "success",
        session 
    })
})

// FUNCTION WHICH CREATES THE NEW BOOKING in DB
// export const createBookingCheckout = catchAsync(async(req, res, next) => {
//     // This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying.
//     const {tour, user, price} = req.query // we destructure the tourid, userid, and tour price. Because we stored them inside the success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, when we created the checkout session.

//     // if there is no session created (user clicks booking tour button). there wont be user, tour and price stored on the req.query object. Go to next middleware. We need to add this middleware to the success_url route, which is `${req.protocol}://${req.get("host")}/ thats our route ==> app.use('/', viewRouter) // viewRouter are the viewRoutes (Frontend routes) where on different routes our viewsController render different pug templates to the client. So after purchasing the user gets directed to overview page with all tours.

//     if (!tour && !user & !price) return next() // this means, if theres no tour,user,price in req.query, then no checkout session was created (user is not clicking buy button). Goes to next middleware.

//     // if there is tour,user,price on req.query, the user clicked on buy button to purchase a tour ==> we are gonna create a booking document with referenced tourid, userid and tour price
//     await Booking.create({tour, user, price})

//     // Respond to client is here the redirection to the landing page. Thats how we hide the success_url, which holds the query with where the userid,tourid and tour price is stored
//     res.redirect(req.originalUrl.split("?")[0]) // redirect is creating a new request to he url we pass in. req.originalUrl.split("?")[0] = `${req.protocol}://${req.get("host")}/ . Means to our root page (route) "/"
// })

const createBookingCheckout = async session => {
    const tour = session.client_reference_id
    console.log(tour);
    const user = (await User.findOne({email: session.customer_email})).id
    const price = session.amount_total / 100 // thats how the object is structured. You can see it on stripe.com in your webhook.
    await Booking.create({tour, user, price})
}


export const webhookCheckout = (req, res, next) => {
    const signature = req.headers["stripe-signature"] // when stripe calls our webhook it will add a header to the request, containing a special signature for our webhook.
    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET) // 3 parameters needed. req.body, stripe signature and stripe webhook secret
    } catch(err) {
        return res.status(400).send(`Webhook error: ${err.message}`)
    }

    if (event.type === "checkout.session.completed") 
        createBookingCheckout(event.data.object)

    res.status(200).json({received: true})
}

export const createBooking = factoryCreateOne(Booking)
export const getBooking = factoryGetOne(Booking)
export const getAllBookings = factoryGetAll(Booking)
export const updateBooking = factoryUpdateOne(Booking)
export const deleteBooking = factoryDeleteOne(Booking)