import axios from "axios"
import { showAlert } from "./alerts.js"


export const login = async(email, password) => {
    try {
        const result = await axios({ // we are sending the data which contains the email and password which the user provided to the client, to our Backend.
            method: "POST",
            url: "/api/v1/users/login", // HTTP REQUEST IS ONE WAY OF SENDING DATA TO THE BACKEND  // needs to be the same path like in the routes! http://127.0.0.1:3000/api/v1/users. We can just delete the localhost from the url when we want to deploy it, because the API and the website are hosted on the same server. Its like creating a relative path to the location of an image.
            data: {
                email,
                password
            }
        })

        if (result.data.status === "success") {
            showAlert("success", 'Logged in successfully!');
            
            window.setTimeout(() => {
                location.assign("/") // after 1.5 seconds we redirect the route to the root "/" - where we see overview of all the tours
            }, 1500)
        }
    } catch(err) {
        showAlert("error", err.response.data.message)
    }
}

export const logout = async () => {
    try {
        const result = await axios({
            method: "GET",
            url: "/api/v1/users/logout",  // needs to be the same path like in the routes! // HTTP REQUEST IS ONE WAY OF SENDING DATA TO THE BACKEND
            
        })
        if ((result.data.status === "success")) location.reload(true) // THIS WILL FORCE A RELOAD FROM THE SERVER SIDE. means the updated cookie is stored on the req.cookies.jwt field. we are logged out!

    } catch(err) {
        console.log(err.response);
        showAlert("error", "Error logging out! Try again.")
    }
}
