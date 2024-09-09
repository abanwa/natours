/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://127.0.0.1:8000/api/v1/users/login",
      data: { email, password }
    });
    console.log(res);

    if (res.data.status === "success") {
      //   alert("Logged in Successfully!");
      showAlert("success", "Logged in Successfully!");

      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    // alert(err.response.data.message);
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://127.0.0.1:8000/api/v1/users/logout"
    });

    if (res.data.status === "success") {
      // with thw rue, it will reload from the SERVER. without the true, it will reload from the browser cache
      location.reload(true);
    }
  } catch (err) {
    console.log(err);
    showAlert("error", "Error logging out. Try again");
  }
};
