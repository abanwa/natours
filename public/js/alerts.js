/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector(".alert");
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
  // first hide the alert element that exist
  hideAlert();
  // show this alert
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

  // hide the alert after 5 seconds
  window.setTimeout(hideAlert, 5000);
};
