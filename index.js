document.addEventListener("DOMContentLoaded", function () {
  const grab = function (block) {
    block.classList.add("blockdisabled");
  };
  const release = function (block) {
    block.classList.remove("blockdisabled");
  };
  flowChart(document.getElementById("canvas"), grab, release);
});
