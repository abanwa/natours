import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
  "pk_test_51Pw3UsCcUmpFwRwBxXc5OrzdQgpQD0yL2cakVegnmYbNDx7wjIi5GaKvRp8temNLYL7ZyXyWe3sK5EY8GqZIMBpk00RHyibIBp"
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    // this will create the checkout session in stripe base on the tourId we want to book
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );

    // console.log(session);

    // 2) Create checkout form + process / charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

    // This will take us to the stripe checkout page
    // window.location.href = session.data.session.url;
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
