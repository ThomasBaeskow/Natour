import axios from "axios"
import { showAlert } from "./alerts.js"


export const bookTour = async tourId => { // the tourId comes from tour.pug where we stored it in (data-tour-id=`${tour.id}`)
    // here we build the functionality of stripe in our frontend. (tour.pug, index.js, stripe.js)
    const stripe = Stripe("pk_test_51M58bGEuMrztGyp5E0Uh3ZPWWEDlfEO4xDG3YJ1IXn4dkoEXzqmerAhVcnx76VfOPm4Ox5S5u0QN7oRlS0RybTL900c3VWK7Xx") // here we need our publishable public key from stripe account
    try {
        // 1) Get checkout session from API (endpoint: .route("/checkout-session/:tourId"))
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`) // axios returns an object with property data, where the actual data is stored. We are fetching the checkout session object to our frontend which gets created in backend, on that route. data is dynamic according to the tourId. We use that checkout session object to create the frontend checkout form and charge the credit card of the user.
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({ // we redirect the user to stripe by passing in as options an object, which holds property value pair sessionId of stripe. Its stored inside session.data.session.id
        sessionId: session.data.session.id
    })

    } catch(err) {
        console.log(err);
        showAlert("error", err) // shw the user as an alert, when there is an error
    }
}