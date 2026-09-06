import * as Fancybox from "./fancy-box.js";
import * as crucial from "./crucial.js"
// Set custom options for elements with the `data-fancybox="gallery"` attribute
Fancybox.Fancybox.bind('[data-fancybox="gallery"]', {
  groupAll: true,
});

(async () => {
  await crucial.init();
})();
