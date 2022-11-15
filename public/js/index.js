import '@babel/polyfill'
import {login, logout} from "./login.js"
import { displayMap } from "./mapbox.js";
import { updateSettings } from './updateSettings.js';

// this file is mostly for getting the data from the user interface.
// DOM ELEMENTS
const mapBox = document.getElementById('map') // Thats the map the created with "mapbox"
const loginForm = document.querySelector('.form--login') // thats the login form with 2 inputs (email, password)
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector(".form-user-data") // thats the form which holds the inputs (data to update from the frontend)
const userPasswordForm = document.querySelector(".form-user-password")

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    console.log(locations);
    displayMap(locations); // we pass in the data from our tour locations. We passed this data in out tour.pug by saving it on mapBox.dataset.locations property.
  }

if (loginForm) {
    loginForm.addEventListener('submit', e => { // we add eventListener to the "submit" event, to the class "form", which is a form.
        e.preventDefault()
        // VALUES
        const email = document.getElementById('email').value // we get the data from the client side. Input field has the id="email"
        const password = document.getElementById('password').value // we get the data from the client side. Inputfield has the id="password"
        login(email, password) // we are passing in the email and the password which the user gives us from the client side.
    })
}

if (logOutBtn) logOutBtn.addEventListener("click", logout) // we add eventListener on the element which has class ".nav__el--logout" at the "click" event. We logout!

if (userDataForm) userDataForm.addEventListener("submit", e => {
    e.preventDefault()
    document.querySelector(".btn--save-password").textContent = "Updating..."
    const name = document.getElementById("name").value // the inputfield have id name
    const email = document.getElementById("email").value // the inputfield have id email
    updateSettings({name, email}, "data") // we pass in our updateData function (which will connect and send this updated data to the backend).Backendcontroller will update DB
})

// CHANGE PASSWORD CURRENT USER
if (userPasswordForm) userPasswordForm.addEventListener("submit", async e => {
    e.preventDefault()
    const passwordCurrent = document.getElementById("password-current").value // the inputfield have id "password-current"
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("password-confirm").value
    await updateSettings({passwordCurrent, password, confirmPassword}, "password") // we pass in our updateData function (which will connect and send this updated data to the backend).Backendcontroller will update DB
    document.querySelector(".btn--save-password").textContent = "Save password"
    document.getElementById("password-current").value = ""
    document.getElementById("password").value = ""
    document.getElementById("password-confirm").value = ""
})