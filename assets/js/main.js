let hiddenElement = document.getElementsByClassName("hidden");
let loadingElement = document.getElementsByClassName("loader");

function clearLoader() {
  if (loadingElement[0] !== undefined)
    loadingElement[0].classList.add("hidden");
  if (hiddenElement[0] !== undefined)
    hiddenElement[0].classList.remove("hidden");
}

setTimeout(clearLoader, 1500);
