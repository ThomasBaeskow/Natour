import User from "../models/user.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken"
import AppError from "../utils/appError.js";


const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN // we add an object as the option, that the JWT expires after 90 days
    })
}

export const signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body)
    // due to security reasons we need to replace above code with following code: We only allow the data we actually need to be saved in the new user in our DB. Even when a user tries to manually add a "role: admin". It wont be stored in the user
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    })

    // JWT - Login Users with secure JWT
    // for authentification we install the package "jsonwebtoken"
    // documentation on github. We can use jwt methods like (sign, verify, etc)
    const token = signToken(newUser._id) // --> the object "{id: newUser._id}" is the payload which we add to our JWT. Second parameter is our "secret" with at least 32 characters. We store it in config.env. third parameter is an additional option. The "JWT Header "will be added automatically from JWT package.
    // we can use the debugger on "jwt.io" to look at our token.(Header,Payload,Secret)

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        },
    })
})

export const login = catchAsync(async (req, res, next) => {
    console.log(req.body);
    const {email, password} = req.body

    // 1) Check if email and password exist
    if(!email || !password) {
        return next(new AppError("Please provide email and password!", 400)) // we use return because we want to stop the login function right away if there is no password or email provided by the client (user). without return our application would send a response to the client from the error AND from our res.json. We can just send one response.
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({email}).select("+password") // --> its short for {email: email} -- this looks in our DB if the email is existing and if the password is correct. .select("+password") means --> we excluded in our model User the password. Thats why we have to add it here again to have access.
    console.log(user);
    // "test1234" === '$2a$12$im0/kJn2OSC4raVqxJb5k.RYJhQmkiome6pL9A4PQcg4wqIAHSuvm' --> we need to compare the encrypted password in DB with users typed in password. To solve this we need to encrypt the users password too in our User model with bcrypt package

    if(!user || !(await user.correctPassword(password, user.password))) { // if theres no user with the given email or the password is not the same --> execute the error and stop the process. // return true if they are same, false if not (password, user.password)
        return next(new AppError("Incorrect email or password!", 401))
    }

    // 3) If everything ok, send token to client
    const token = signToken(user._id)
    res.status(200).json({
        status: "success",
        token
    })
})

