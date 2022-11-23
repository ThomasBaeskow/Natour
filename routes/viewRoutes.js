import express from "express";
import { getOverview, getTour, getLoginForm, getAccount, updateUserData, getMyTours, alerts} from "../controllers/viewsController.js";
import { isLoggedIn, protect } from "../controllers/authController.js";
// import { createBookingCheckout } from "../controllers/bookingController.js";


const router = express.Router()

router.use(alerts)

  // Views route for rendering overview page with all tours
  // overview.pug extends the base --> it includes the base, thats why we can render just overview.pug or tour.pug and still rendering base with it. 
router.get("/", isLoggedIn, getOverview)
  
  // Views route for rendering overview page for a specific tour // in overview.pug template we have a anchor tag which redirects our route to /tour/${item.slug}. So the getTour controller will apply.
router.get("/tour/:slug",isLoggedIn, getTour)

// renders the login page
router.get("/login", isLoggedIn, getLoginForm)

// renders the Current User account page
router.get("/me", protect, getAccount)

// renders the Current Users booked tours page
router.get("/my-tours", protect, getMyTours) // createBookingCheckout is not needed after deploying and using strip webhooks

// updates the user data in the backend DB Collection User.
router.post("/submit-user-data", protect, updateUserData)


export default router