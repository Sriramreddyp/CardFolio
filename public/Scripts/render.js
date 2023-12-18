//** Global Object for Storing retrived data */
var Data;

//**Utility function to create a radioButton */
function createRadioElement(id) {
  var radioHtml = '<input type="checkbox" id="' + id + '"';

  radioHtml += "/>";

  var radioFragment = document.createElement("span");
  radioFragment.innerHTML = radioHtml;

  return radioFragment.firstChild;
}

//** To create Outlet of the table */
function generateTableHead(table, data) {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of data) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
  //? Rendering a radioButtion
  let th = document.createElement("th");
  let text = document.createTextNode("Check For Ack");
  th.appendChild(text);
  row.appendChild(th);
}

//** To Render Information inside the table */
function generateTable(table, data) {
  for (let element of data) {
    let row = table.insertRow();
    for (key in element) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[key]);
      cell.appendChild(text);
    }
    let cell = row.insertCell();
    let radioButton = createRadioElement("InsertionCheck");
    cell.appendChild(radioButton);
  }
}

//**Data Retrival from backEnd */
async function fetchData() {
  var PromiseReturn = new Promise((resolve, _reject) => {
    try {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          console.log(JSON.parse(xhr.responseText));
          resolve(JSON.parse(xhr.responseText));
        }
      };

      xhr.open("POST", "/phar/userInfo");
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      let response = document.getElementById("username").value;
      let obj = {
        id: response,
      };
      xhr.send(JSON.stringify(obj));
    } catch (err) {
      resolve(false);
    }
  });
  return await PromiseReturn;
}

//**Status Updation from backEnd */
async function updateStatus(id) {
  var PromiseReturn = new Promise((resolve, _reject) => {
    try {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          console.log(JSON.parse(xhr.responseText));
          resolve(JSON.parse(xhr.responseText));
        }
      };
      xhr.open("POST", "/phar/presUpdate");
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      let response = id;
      let obj = {
        id: response,
      };
      xhr.send(JSON.stringify(obj));
    } catch (err) {
      resolve(false);
    }
  });
  return await PromiseReturn;
}

//** Main Render Function called by frontEnd page */
async function renderTable() {
  try {
    const renderDataJson = await fetchData();

    Data = renderDataJson.Information;
    document.getElementById("user-info").innerHTML =
      "Hello" + " ," + renderDataJson.name;
    let table = document.getElementById("User-Info");
    let data = Object.keys(renderDataJson.Information[0]);
    generateTableHead(table, data);
    generateTable(table, renderDataJson.Information);
  } catch (err) {
    document.getElementById("Err-Msg").innerHTML =
      "Cannot Render The Table - Internal Server Error!!";
  }
}

//** To get info about the checkBoxes which have been checked by user */
async function retrieveStatus() {
  try {
    var checkStatus = document.querySelectorAll("#InsertionCheck");
    for (let i = 0; i < checkStatus.length; i++) {
      if (checkStatus[i].checked == true) {
        let id = Data[i].id;
        let UpdationStatus = await updateStatus(id);
        if (UpdationStatus.status != true) throw "Cannot Update the Status";
      }
    }
    document.getElementById("Err-Msg").innerHTML =
      "Prescription Status Updated Sucessfully!!";
  } catch (err) {
    console.log(err);
    document.getElementById("Err-Msg").innerHTML =
      "Cannot Update The Status - Internal Server Error!!";
  }
}
