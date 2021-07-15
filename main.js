let imgElement = document.querySelector("#imageSrc");
let inputElement = document.querySelector("#input");

inputElement.addEventListener("change", (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
});
/*
imgElement.onload = function() {
  let mat = cv.imread(imgElement);
  cv.imshow('outputCanvas', mat)
  mat.delete();
}
*/

function download() {
  let canvas = document.querySelector("#outputCanvas");
  let img = canvas.toDataURL("image/png");
  document.querySelector("#download").href = img;
  console.log(canvas);
}
document.querySelector("#download").addEventListener("click", download);
/*
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
*/
const attachCropBox = function (imgWidth, imgHeight) {
  let margin = { top: 40, right: 40, bottom: 40, left: 40 },
    width = imgWidth - margin.left - margin.right,
    height = imgHeight - margin.top - margin.bottom;
  let sourcePoints = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ],
    targetPoints = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ];

  let svg = d3
    .select("#input-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "window_g");

  let line = svg
    .selectAll(".line")
    .data(
      d3
        .range(0, width + 1, 41)
        .map(function (x) {
          return [
            [x, 0],
            [x, height],
          ];
        })
        .concat(
          d3.range(0, height + 1, 41).map(function (y) {
            return [
              [0, y],
              [width, y],
            ];
          })
        )
    )
    .enter()
    .append("path")
    .attr("class", "line line--x");

  let handle = svg
    .selectAll(".handle")
    .data(targetPoints)
    .enter()
    .append("circle")
    .attr("class", "handle")
    .attr("transform", function (d) {
      return "translate(" + d + ")";
    })
    .attr("r", 7)
    .call(
      d3.behavior
        .drag()
        .origin(function (d) {
          return { x: d[0], y: d[1] };
        })
        .on("drag", dragged)
    );

  d3.selectAll("button")
    .datum(function (d) {
      return JSON.parse(this.getAttribute("data-targets"));
    })
    .on("click", clicked)
    .call(transformed);

  function clicked(d) {
    d3.transition()
      .duration(750)
      .tween("points", function () {
        if (!(d == null)) {
          let i = d3.interpolate(targetPoints, d);
          return function (t) {
            handle.data((targetPoints = i(t))).attr("transform", function (d) {
              return "translate(" + d + ")";
            });
            transformed();
          };
        }
      });
  }

  function dragged(d) {
    d3.select(this).attr(
      "transform",
      "translate(" + (d[0] = d3.event.x) + "," + (d[1] = d3.event.y) + ")"
    );
    transformed();
  }

  function transformed() {
    let a = [],
      b = [],
      i = 0,
      n = sourcePoints.length;
    for (; i < n; ++i) {
      let s = sourcePoints[i],
        t = targetPoints[i];
      a.push([s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]]),
        b.push(t[0]);
      a.push([0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]]),
        b.push(t[1]);
    }

    let X = solve(a, b, true),
      matrix = [
        X[0],
        X[3],
        0,
        X[6],
        X[1],
        X[4],
        0,
        X[7],
        0,
        0,
        1,
        0,
        X[2],
        X[5],
        0,
        1,
      ].map(function (x) {
        return d3.round(x, 6);
      });

    line.attr("d", function (d) {
      return "M" + project(matrix, d[0]) + "L" + project(matrix, d[1]);
    });
  }
  function project(matrix, point) {
    point = multiply(matrix, [point[0], point[1], 0, 1]);
    return [point[0] / point[3], point[1] / point[3]];
  }

  function multiply(matrix, vector) {
    return [
      matrix[0] * vector[0] +
        matrix[4] * vector[1] +
        matrix[8] * vector[2] +
        matrix[12] * vector[3],
      matrix[1] * vector[0] +
        matrix[5] * vector[1] +
        matrix[9] * vector[2] +
        matrix[13] * vector[3],
      matrix[2] * vector[0] +
        matrix[6] * vector[1] +
        matrix[10] * vector[2] +
        matrix[14] * vector[3],
      matrix[3] * vector[0] +
        matrix[7] * vector[1] +
        matrix[11] * vector[2] +
        matrix[15] * vector[3],
    ];
  }
};

imgElement.onload = function () {
  let img = cv.imread(imgElement);
  let imgWidth = imgElement.width;
  let imgHeight = imgElement.height;
  attachCropBox(imgWidth, imgHeight);
  cv.imshow("outputCanvas", img);
  img.delete();
};

function crop() {
  let pointsArray = [];
  const children = document.querySelectorAll("#window_g .handle");
  children.forEach((e) => {
    const pos = e.getAttribute("transform");
    const point = pos.replace("translate(", "").replace(")", "").split(",");
    pointsArray.push(point[0]);
    pointsArray.push(point[1]);
  });
  const imageHeight = +document.getElementById("height").value;
  const imageWidth = document.getElementById("imageSrc").width;
  const svgCropHeight =
    document.querySelector("#input-container svg").getAttribute("height") - 80;
  const svgCropWidth =
    document.querySelector("#input-container svg").getAttribute("width") - 80;

  const scaleFactor = parseInt(imageWidth / svgCropWidth);
  pointsArray = pointsArray.map((e) => {
    const num = parseInt((parseInt(e) + 40) / scaleFactor);
    return num;
  });
  let src = cv.imread("imageSrc");
  let dst = new cv.Mat();
  let dsize = new cv.Size(imageWidth, imageHeight);
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, pointsArray);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    imageWidth,
    0,
    imageWidth,
    imageHeight,
    0,
    imageHeight,
  ]);
  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(
    src,
    dst,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );
  cv.imshow("outputCanvas", dst);
  src.delete();
  dst.delete();
  M.delete();
  srcTri.delete();
  dstTri.delete();
}

document.querySelector("#crop").addEventListener("click", crop);
