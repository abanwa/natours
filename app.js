require("@babel/polyfill");
var $jdyyP$axios = require("axios");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/* eslint-disable */ 
/* eslint-disable */ // console.log("hello from the client side :D");
// The locations will be gotten from index
// const locations = JSON.parse(document.getElementById("map").dataset.locations);
// console.log(locations);
const $cdc0efe15a234f89$export$4c5dd147b21b9176 = (locations)=>{
    mapboxgl.accessToken = "pk.eyJ1IjoiYWJhbndhIiwiYSI6ImNtMG1ocnFzcTAyOWkya3NiZjEwenFhcDIifQ.6A5GAtEuoDQaMgT2bnV5xA";
    var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        //   style: "mapbox://styles/abanwa/cm0nl4w1300co01pjgc1keiwl"
        scrollZoom: false
    });
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc)=>{
        // Create marker
        const el = document.createElement("div");
        el.className = "marker";
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: "bottom"
        }).setLngLat(loc.coordinates).addTo(map);
        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);
        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};


/* eslint-disable */ 
/* eslint-disable */ const $cb8ce09cb8bf6e76$export$516836c6a9dfc573 = ()=>{
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};
const $cb8ce09cb8bf6e76$export$de026b00723010c1 = (type, msg, time = 7)=>{
    // first hide the alert element that exist
    $cb8ce09cb8bf6e76$export$516836c6a9dfc573();
    // show this alert
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    // hide the alert after 5 seconds
    window.setTimeout($cb8ce09cb8bf6e76$export$516836c6a9dfc573, time * 1000);
};


const $775abdec7d40fe17$export$596d806903d1f59e = async (email, password)=>{
    try {
        const res = await (0, ($parcel$interopDefault($jdyyP$axios)))({
            method: "POST",
            // url: "http://127.0.0.1:8000/api/v1/users/login",
            url: "/api/v1/users/login",
            data: {
                email: email,
                password: password
            }
        });
        console.log(res);
        if (res.data.status === "success") {
            //   alert("Logged in Successfully!");
            (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("success", "Logged in Successfully!");
            window.setTimeout(()=>{
                location.assign("/");
            }, 1500);
        }
    } catch (err) {
        // alert(err.response.data.message);
        (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("error", err.response.data.message);
    }
};
const $775abdec7d40fe17$export$a0973bcfe11b05c9 = async ()=>{
    try {
        const res = await (0, ($parcel$interopDefault($jdyyP$axios)))({
            method: "GET",
            // url: "http://127.0.0.1:8000/api/v1/users/logout"
            url: "/api/v1/users/logout"
        });
        if (res.data.status === "success") // with thw rue, it will reload from the SERVER. without the true, it will reload from the browser cache
        location.reload(true);
    } catch (err) {
        console.log(err);
        (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("error", "Error logging out. Try again");
    }
};


/*  eslint-disable  */ 

const $751a50af865a6d2c$export$f558026a994b6051 = async (data, type)=>{
    try {
        const url = type === "password" ? `/api/v1/users/updateMyPassword` : "/api/v1/users/updateMe";
        const res = await (0, ($parcel$interopDefault($jdyyP$axios)))({
            method: "PATCH",
            url: url,
            data: data
        });
        if (res.data.status === "success") (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("success", `${type.toUpperCase()} updated successfully!`);
    } catch (err) {
        (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("error", err.response.data.message);
    }
};




const $29abee557e7f55a9$var$stripe = Stripe("pk_test_51Pw3UsCcUmpFwRwBxXc5OrzdQgpQD0yL2cakVegnmYbNDx7wjIi5GaKvRp8temNLYL7ZyXyWe3sK5EY8GqZIMBpk00RHyibIBp");
const $29abee557e7f55a9$export$8d5bdbf26681c0c2 = async (tourId)=>{
    try {
        // 1) Get checkout session from API
        // this will create the checkout session in stripe base on the tourId we want to book
        const session = await (0, ($parcel$interopDefault($jdyyP$axios)))(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Create checkout form + process / charge credit card
        await $29abee557e7f55a9$var$stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    // This will take us to the stripe checkout page
    // window.location.href = session.data.session.url;
    } catch (err) {
        console.log(err);
        (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("error", err);
    }
};



// DOM ELEMENTS
const $37da9664eaa7cb92$var$mapBox = document.getElementById("map");
const $37da9664eaa7cb92$var$loginForm = document.querySelector(".form--login");
const $37da9664eaa7cb92$var$logOutBtn = document.querySelector(".nav__el--logout");
const $37da9664eaa7cb92$var$userDataForm = document.querySelector(".form-user-data");
const $37da9664eaa7cb92$var$userPasswordForm = document.querySelector(".form-user-password");
const $37da9664eaa7cb92$var$bookBtn = document.getElementById("book-tour");
// DELEGATION
if ($37da9664eaa7cb92$var$mapBox) {
    const locations = JSON.parse($37da9664eaa7cb92$var$mapBox.dataset.locations);
    (0, $cdc0efe15a234f89$export$4c5dd147b21b9176)(locations);
}
if ($37da9664eaa7cb92$var$loginForm) $37da9664eaa7cb92$var$loginForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    (0, $775abdec7d40fe17$export$596d806903d1f59e)(email, password);
});
if ($37da9664eaa7cb92$var$logOutBtn) $37da9664eaa7cb92$var$logOutBtn.addEventListener("click", (0, $775abdec7d40fe17$export$a0973bcfe11b05c9));
if ($37da9664eaa7cb92$var$userDataForm) $37da9664eaa7cb92$var$userDataForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    // we will programmatically create a multipart/form-data to submit all the data
    const form = new FormData();
    // we will append data to the form
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    (0, $751a50af865a6d2c$export$f558026a994b6051)(form, "data");
});
if ($37da9664eaa7cb92$var$userPasswordForm) $37da9664eaa7cb92$var$userPasswordForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await (0, $751a50af865a6d2c$export$f558026a994b6051)({
        passwordCurrent: passwordCurrent,
        password: password,
        passwordConfirm: passwordConfirm
    }, "password");
    document.querySelector(".btn--save-password").textContent = "Save password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
});
if ($37da9664eaa7cb92$var$bookBtn) $37da9664eaa7cb92$var$bookBtn.addEventListener("click", async (e)=>{
    e.preventDefault();
    e.target.textContent = "Processing...";
    const { tourId: tourId } = e.target.dataset;
    await (0, $29abee557e7f55a9$export$8d5bdbf26681c0c2)(tourId);
    e.target.textContent = "Book tour now!";
});
const $37da9664eaa7cb92$var$alertMessage = document.querySelector("body").dataset.alert;
if ($37da9664eaa7cb92$var$alertMessage) (0, $cb8ce09cb8bf6e76$export$de026b00723010c1)("success", $37da9664eaa7cb92$var$alertMessage, 20);


//# sourceMappingURL=app.js.map
