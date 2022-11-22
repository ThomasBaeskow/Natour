/* eslint-disable import/extensions */
import mongoose from "mongoose"
import app from './app.js';
import dotenv from "dotenv"

const port = process.env.PORT || 3000; // thats mandatory for deploying on heroku

dotenv.config({ path: './config.env' });

// placing "<PASSWORD>" in the connection string in config.env with our user Password. Which is saved in environmental variables.
const DB = process.env.DATABASE


// connection to hosted ATLAS database
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}
)
.then(() => 
 app.listen(port, console.log(`DB connected and listening on ${port}`)))
.catch((err) => {
  console.log(`${err} did not connect...`);
})


process.on("unhandledRejection", err => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1)
  })
}) 

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1)
})

// SIGNAL to stop the application. Heroku will shut down our application every 24 hours by sending this signal/event to our application. This allows our requests to complete and then the application shuts down.
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated!");
  })
})
// console.log(x);

// global error Handler:
// app.use((error, req, res, next) => {
//   res.status(error.status || 500);
//   res.json({
//     error: {
//       message: error.message,
//     },
//   });
// });


// defining a Schema:
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "A tour must have a name"],
//     unique: true
//   },
//   rating: {
//     type: Number,
//     default: 4.5
//   },
//   price: {
//     type: Number,
//     required: [true, "A tour must have a price"]
//   }
// })
// creating a Model out of it: Model variables always wih capital Letter.
// const Tour = mongoose.model("Tour",tourSchema)

// const testTour = new Tour({
//   name: "The Park Camper",
//   rating: 4.7,
//   price: 997
// })
// this saves the document to our hosted database Atlas, which is connected to mongosh and mongodb-compass
// testTour.save().then(doc => {
//   console.log(doc);
// }).catch(err => {
//   console.log("ERROR", err);
// })

// Connection to LOCAL database:
// mongoose.connect(process.env.DATABASE_LOCAL, {
//   useNewUrlParser: true,
//   useCreateIndex: true,
//   useFindAndModify: false
// }).then(() => console.log("DB connection successful"))

// listen to our Server
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

// USE "npm run start:dev or npm run start:prod" in terminal to run the server. We changed the script in package.json from test to start with value "nodemon server.js"

// 1. install following dependencies in next project like:
// npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev
// 2. create .eslintrc.json and copy inside:
// {
//   "extends": ["airbnb", "prettier", "plugin:node/recommended"],
//   "plugins": ["prettier"],
//   "rules": {
//     "prettier/prettier": "error",
//     "spaced-comment": "off",
//     "no-console": "off",
//     "consistent-return": "off",
//     "func-names": "off",
//     "object-shorthand": "off",
//     "no-process-exit": "off",
//     "no-param-reassign": "off",
//     "no-return-await": "off",
//     "no-underscore-dangle": "off",
//     "class-methods-use-this": "off",
//     "prefer-destructuring": ["error", { "object": true, "array": false }],
//     "no-unused-vars": ["error", { "argsIgnorePattern": "req|res|next|val" }]
//   }
// }
// 3. create .prettierrc and copy following inside:
// {
//   "singleQuote": true
// }
