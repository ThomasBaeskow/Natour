
export const hideAlert = () => {
    const el = document.querySelector(".alert") // we select the div with the "alert" class
    if (el) el.parentElement.removeChild(el) // we remove the element.
}

// type is "success" or "error"
export const showAlert = (type, msg) => {
    hideAlert()
    const markup = `<div class="alert alert--${type}">${msg}</div>`
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup) // right at the beginning of the body we create a div, which gets classes according to the parameter passed into showAlert(type,msg) in login.js
    window.setTimeout(hideAlert, 5000) // the div element will be removed after 5 seconds
}