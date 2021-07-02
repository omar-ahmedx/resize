let imgElement = document.querySelector('#imageSrc');
let inputElement = document.querySelector('#input');

inputElement.addEventListener("change", (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
});

imgElement.onload = function() {
  let mat = cv.imread(imgElement);
  cv.imshow('outputCanvas', mat)
  mat.delete();
}


function download() {
  let canvas = document.querySelector("#outputCanvas");
  let img    = canvas.toDataURL("image/png");
  document.querySelector('#download').href = img;
}
function resize() {
  let width = +document.querySelector('#width').value;
  let height =+document.querySelector('#height').value;
  let src = cv.imread("imageSrc");
  let dst = new cv.Mat();
  let dsize = new cv.Size(height, width);
  cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow('outputCanvas', dst);
  src.delete();
  dst.delete();
  download();
}
document.querySelector("#resize").addEventListener('click', resize)
