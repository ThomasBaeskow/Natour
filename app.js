/* eslint-disable import/extensions */
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from "./routes/reviewRoutes.js"
import viewRouter from "./routes/viewRoutes.js"
import AppError from "./utils/appError.js"
import {globalErrorHandler} from "./controllers/errorController.js"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import xss from "xss-clean"
import hpp from "hpp"
import cookieParser from "cookie-parser"
import bookingRouter from "./routes/bookingRoutes.js"
import compression from "compression"
import cors from "cors"



dotenv.config({ path: './config.env' });

const __dirname = path.resolve();

const app = express();

// we want to enable proxis (heroku) - "trust proxy" is express build in
app.enable("trust proxy")

// DEFINE VIEW ENGINE (MVC architecture- 3 components: model, views, controller)
// express automatically supports the most common engines like "pug". We need to install and import it
// example in base.pug (h1 The Park Camper ==> transforms into: <h1>The Park Camper</h1> by pug engine)
app.set("view engine", "pug")
// in which folder the views are located in: BUILDING THE CONNECTION TO "views" folder.
app.set("views", path.join(__dirname, "views")) // Thats the correct way to write, because of a common bug. We could also write but this is not save regarding the common bug: ("views", `${__dirname}/views`)

// GLOBAL MIDDLEWARES
// implement cors - Access-Control-Allow-Origin header is added
app.use(cors())

// options is like another http method (get,post,patch,delete,etc). The browser sends an option request, when there is a preflight phase. (delete or patch requests)
app.options("*", cors())

// 1) Serving static files
// app.use(express.static(`${__dirname}/public`)); // when we type now in our browser 127.0.0.1:3000/overview.html we can see our html file displayed in the browser. We can do that with all our static files
app.use(express.static(path.join(__dirname, "public")))

// 2) Set security HTTP headers
// install helmet and call it. Its better to call the helmet early in your middleware stack to be sure, that the headers are set. (Postman you can see Headers)
// app.use(helmet())

// 3) Development logging
if (process.env.NODE_ENV === 'development') { // - We just want to use morgan middleware when we are in development, not in production.
  app.use(morgan('dev'));
}

// 4) Limit requests from same API
// install express-rate-limit package for limiting requests from an IP using the function rateLimit()
const limiter = rateLimit({
  max: 100, // count of requests limited
  windowMs: 60 * 60 * 1000, // this allows 100 requests from the same IP in 60 minutes
  message: "Too many requests from this IP, please try again in an hour!"
})

// Body parser, reading data from body into req.body
app.use("/api", limiter) // we just want to apply our limiter middleware for routes which start with "/api". When we restart our application (save), the limit resets
app.use(cookieParser())
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5) Body parser, reading data from body into req.body
app.use(express.json({limit: "10kb"})); // we can add options to our .json middleware to limit the data which the client can send to our application. We limit to10 kilobyte

// 6) Data sanitization 
// a) against NoSQL query injection
app.use(mongoSanitize()) // it looks in req.body.query and filter out all "$" and "."
// when we pass as user input a query, we can log in to a users Account without knowing the email address. Program creates a valid token etc... Thats why we need to install "express-mongo-sanitize"
// {
//   "email": {"$gt": ""},
//   "password": "ja%nine1990"
// }
// b) against XSS - HTML and js script input
app.use(xss())

// 7) hpp - Prevent Parameter Pollution // {{URL}}api/v1/tours?sort=duration&sort=price - here we got duplication of sort which will create an Array sort = ["duration", "price"], which we cannot split in our APIFeatures.js
// we can pass in an object with property whitelist, which is an array of the fields where we allow multiple queries for "duration" --> {{URL}}api/v1/tours?duration=5&duration=9
app.use(hpp({ 
  whitelist: [
    "duration",
    "ratingsQuantity",
    "ratingsAverage",
    "maxGroupSize",
    "difficulty",
    "price"
  ]
}))

// calling this packages compresses all the text or json data which is send from backend to the client. Increases performance speed.
app.use(compression())

// 8) Test middleware
// request time for every request added to the request object as a key.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ROUTES:

// API routes
app.use('/', viewRouter) // for rendering pug templates to the client
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/booking", bookingRouter);



// ERROR HANDLING:
// "all" means all http methods (get,post,delete, etc). "*" means all routes.
// this middleware should be always at the end of the call-stack. This middleware will never be reached, if the route is defined.
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404)) // when we pass in the error, the next will skip all the other middleware in the stack and goes to the next error middleware
})

// Jonas global error handler:
// by implementing 4 arguments (parameters) express knows, that this is a global error handling middleware
app.use(globalErrorHandler)


export default app;
