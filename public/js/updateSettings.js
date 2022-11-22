import axios from "axios"
import {showAlert} from "./alerts.js"

// type is either "password" or "data". "data" is the data object
export const updateSettings = async(data, type) => { // the 2 parameter (data) we want to update in our API
    try {
        const url = type === "password" ? "/api/v1/users/updateMyPassword" : "/api/v1/users/updateMe"
        const result = await axios({
            method: "PATCH",
            url: url, // the route in backend which we want to update ( where our controller UpdateMe is mounted). We update the name and email in our DB of the current User
            data
        })
        if (result.data.status === "success") {
            showAlert("success", `${type.toUpperCase()} updated successfully!`)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}