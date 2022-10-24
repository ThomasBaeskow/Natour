import AppError from "../utils/appError.js"


// FUNCTIONS FOR GLOBAL ERROR HANDLER:

// CastError: HANDLE INVALID INPUT
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.` // path and value are saved in the error object automatically as properties.
    return new AppError(message, 400)
}

// MongoError: HANDLE DUPLICATE FIELDS
const handleDuplicateFieldsDB = err => {
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0] // matches all the text between strings ("') [0] picks the first string of the array which you can se in console.log(value) without [0]
    console.log(value);

    const message = `Duplicate field value: ${value} is already existing!` // path and value are saved in the error object automatically as properties.
    return new AppError(message, 400)
}

// MongoError: Validation Error
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(item => item.message)
    const message = `Invalid input data! ${errors.join(". ")}`
    return new AppError(message, 400)
}

// JsonWebTokenError - token not valid
const handleJsonWebTokenErrorDB = () => new AppError("Invalid token. Please log in again!", 401) // short version of using {return}, when you have a one-liner.

// handleTokenExpiredErrorDB -  token expired
const handleTokenExpiredErrorDB = () => new AppError("Your token has expired! Please log in again.", 401)


// DISTINGUISH BETWEEN DEV AND PROD:
// DEV
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      })
}

// PROD
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client (if the user input invalid data, wants to visit a route which does not exist, etc.)
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
          })
    
    // Programming or other unknown error: dont leak error details to the client (user)
    } else {
        // 1) Log error
        console.error("ERROR", err);
        // 2) Send generic message
        res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        })
    }
    
}


// GLOBAL ERROR HANDLER:
export const globalErrorHandler = (err, req, res, next) => {
//   console.log(err.stack);
    err.statusCode = err.statusCode || 500
    err.status = err.status || "error"

    // here we want to show the error in a different way, when we are in development or production mode. We declared that in our config.env and script in package.json
    if(process.env.NODE_ENV === "development") {
        console.log(err.name);
        sendErrorDev(err, res)

    } else if (process.env.NODE_ENV === "production") {
        let {name, code} = err // destructer infos which i need
        console.log(err);
        console.log(name);

        // castError
        if(name === "CastError") {
            err = handleCastErrorDB(err)
        }

        // duplicate fields
        if(code === 11000) {
            err = handleDuplicateFieldsDB(err)
        }

        // validationError
        if(name === "ValidationError") {
            err = handleValidationErrorDB(err)
        }

        // JsonWebTokenError - when token is not valid
        if (name === "JsonWebTokenError") {
            err = handleJsonWebTokenErrorDB()
        }

        if (name = "TokenExpiredError") {
            err = handleTokenExpiredErrorDB()
        }

        // sending the response to the client
        sendErrorProd(err, res)
    }
  }