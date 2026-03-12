function addRow() {
  let table = document.getElementById("dataTable");

  let row = table.insertRow();

  let c1 = row.insertCell(0);
  let c2 = row.insertCell(1);

  c1.innerHTML = '<input type="number">';
  c2.innerHTML = '<input type="number">';
}

//Lagrange Interpolation
function lagrange(x, y, xp) {
  let n = x.length;
  let yp = 0;

  for (let i = 0; i < n; i++) {
    let term = y[i];

    for (let j = 0; j < n; j++) {
      if (j != i) {
        term = (term * (xp - x[j])) / (x[i] - x[j]);
      }
    }

    yp += term;
  }

  return yp;
}

//Newton Forward Method
function newtonForward(x, y, xp) {
  let n = x.length;
  let diff = [];

  for (let i = 0; i < n; i++) {
    diff[i] = [];
    diff[i][0] = y[i];
  }

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      diff[i][j] = diff[i + 1][j - 1] - diff[i][j - 1];
    }
  }

  let h = x[1] - x[0];
  let s = (xp - x[0]) / h;

  let yp = y[0];
  let fact = 1;
  let sTerm = 1;

  for (let i = 1; i < n; i++) {
    fact *= i;
    sTerm *= s - (i - 1);

    yp += (sTerm * diff[0][i]) / fact;
  }

  return yp;
}

//Newton Backward Method
function newtonBackward(x, y, xp) {
  let n = x.length;
  let diff = [];

  for (let i = 0; i < n; i++) {
    diff[i] = [];
    diff[i][0] = y[i];
  }

  for (let j = 1; j < n; j++) {
    for (let i = n - 1; i >= j; i--) {
      diff[i][j] = diff[i][j - 1] - diff[i - 1][j - 1];
    }
  }

  let h = x[1] - x[0];
  let s = (xp - x[n - 1]) / h;

  let yp = y[n - 1];
  let fact = 1;
  let sTerm = 1;

  for (let i = 1; i < n; i++) {
    fact *= i;
    sTerm *= s + (i - 1);

    yp += (sTerm * diff[n - 1][i]) / fact;
  }

  return yp;
}

//Main Prediction Controller

function predictLoad() {
  let table = document.getElementById("dataTable");

  let x = [];
  let y = [];

  for (let i = 1; i < table.rows.length; i++) {
    let t = parseFloat(table.rows[i].cells[0].children[0].value);
    let l = parseFloat(table.rows[i].cells[1].children[0].value);

    if (!isNaN(t) && !isNaN(l)) {
      x.push(t);
      y.push(l);
    }
  }
  if (x.length < 2) {
    alert("Please enter at least two data points");
    return;
  }
  let combined = x.map((e, i) => ({ x: e, y: y[i] }));

  combined.sort((a, b) => a.x - b.x);

  x = combined.map((e) => e.x);
  y = combined.map((e) => e.y);

  let xp = parseFloat(document.getElementById("predictX").value);

  let method = document.querySelector('input[name="method"]:checked').value;

  let result;

  if (method === "lagrange") result = lagrange(x, y, xp);
  else if (method === "forward") result = newtonForward(x, y, xp);
  else result = newtonBackward(x, y, xp);

  document.getElementById("result").innerHTML =
    "Predicted Load = " + result.toFixed(2) + " MW";

  gridAnalysis(result);

  drawGraph(x, y, xp, result);
}

//grid stability analysis
function gridAnalysis(load) {
  let status;

  if (load < 150) status = "Grid Status: STABLE";
  else if (load < 200) status = "Grid Status: MODERATE LOAD";
  else status = "Grid Status: WARNING – Voltage Drop Risk";

  document.getElementById("gridStatus").innerHTML = status;
}

//load curve graph
let chart;

function drawGraph(x, y, xp, yp) {
  let labels = [...x, xp];
  let values = [...y, yp];

  if (chart) chart.destroy();

  let ctx = document.getElementById("loadChart");

  chart = new Chart(ctx, {
    type: "line",

    data: {
      labels: labels,
      datasets: [
        {
          label: "Load Curve",
          data: values,
          fill: false,
          borderColor: "blue",
          tension: 0.1,
        },
      ],
    },
  });
}

//javascript csv reader
function loadCSV() {
  let file = document.getElementById("csvFile").files[0];

  if (!file) {
    alert("Please select a CSV file");
    return;
  }

  let reader = new FileReader();

  reader.onload = function (e) {
    let text = e.target.result.trim();

    let rows = text.split("\n");

    let table = document.getElementById("dataTable");

    /* CLEAR OLD ROWS */

    while (table.rows.length > 1) {
      table.deleteRow(1);
    }

    /* ADD NEW ROWS */

    for (let i = 1; i < rows.length; i++) {
      let cols = rows[i].trim().split(",");

      if (cols.length < 2) continue;

      let hour = cols[0].trim();
      let load = cols[1].trim();

      let row = table.insertRow();

      let c1 = row.insertCell(0);
      let c2 = row.insertCell(1);

      c1.innerHTML = `<input type="number" value="${hour}">`;
      c2.innerHTML = `<input type="number" value="${load}">`;
    }
  };

  reader.readAsText(file);
}

//24-Hour Forecast Algorithm
function forecast24() {
  let table = document.getElementById("dataTable");

  let x = [];
  let y = [];

  for (let i = 1; i < table.rows.length; i++) {
    let t = parseFloat(table.rows[i].cells[0].children[0].value);
    let l = parseFloat(table.rows[i].cells[1].children[0].value);

    if (!isNaN(t) && !isNaN(l)) {
      x.push(t);
      y.push(l);
    }
  }

  let forecastX = [];
  let forecastY = [];

  for (let hour = 1; hour <= 24; hour++) {
    let load = lagrange(x, y, hour);

    forecastX.push(hour);
    forecastY.push(load);
  }

  drawForecast(forecastX, forecastY);
}

//forecast graph function
function drawForecast(x, y) {
  if (chart) chart.destroy();

  let ctx = document.getElementById("loadChart");

  chart = new Chart(ctx, {
    type: "line",

    data: {
      labels: x,

      datasets: [
        {
          label: "24 Hour Load Forecast",
          data: y,
          borderColor: "red",
          fill: false,
        },
      ],
    },
  });
}
