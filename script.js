const $ = require('jquery');
const fs = require("fs");
const dialog = require("electron").remote.dialog;

$(document).ready(function () {
  let db,lastClickedCell;
  $(".content-container").on("scroll",function () {
    console.log("scroll");
  })

$("#File").on("click",function () {

    $(".file-menu").addClass("selected-menu");
    $(".home-menu").removeClass("selected-menu");

})
$("#Home").on("click",function () {
  $(".home-menu").addClass("selected-menu");
  $(".file-menu").removeClass("selected-menu");
})


$("#New").on("click", function () {
  db = [];
  let allRows = $(".col");
  for(let i=0;i<allRows.length;i++){
    let myRow = allRows[i];
    let allCols = $(myRow).find(".cell");
    let row =[];
    for(let j=0;j<allCols.length;j++){
      $(allCols[j]).html("");
      let cell = {
        rowId : i,
        colId : j,
        data : "",
        formula : "",
        upStream : [],
        downStream : [],
        fontSize: 12,
        fontStyle : "sans-serif",
        color : "black",
        alignment: "left",
        bold: false,
        italic : false,
        underline: false
      }
      row.push(cell);
    }
    db.push(row);
  }
})

$("#Open").on("click", async function () {
  let open =await dialog.showOpenDialog();
  let path = open.filePaths[0];
  if(!path){
    alert("Please select the file first");
    return;
  }
  let data = fs.readFileSync(path);
  let json = JSON.parse(data);
  db = json;

  let allRows = $(".col");
  for(let i=0;i<allRows.length;i++){
    let myRow = allRows[i];
    let allCols = $(myRow).find(".cell");
    let row =[];
    for(let j=0;j<allCols.length;j++){
      $(allCols[j]).html(db[i][j].data);
    }
  }

})

$("#Save").on("click",async function () {
  let save = await dialog.showSaveDialog();
  let path = save.filePath;
  if(!path){
    alert("Please select the file first");
    return;
  }
  let data = JSON.stringify(db);
  fs.writeFileSync(path, data);


})

/****************** Menu options******************/
$("#bold").on("click",function () {
  $(this).toggleClass("isOn");

  let isBold = $(this).hasClass("isOn");
  let cell = $(".cell.selected");
  if(isBold){
    $(cell).css("font-weight","bold");
  }else{
    $(cell).css("font-weight","normal");
  }
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].bold = isBold;

})

$("#italic").on("click",function () {
  $(this).toggleClass("isOn");
  let isItalic = $(this).hasClass("isOn");
  let cell = $(".cell.selected");
  if(isItalic){
    $(cell).css("font-style","italic");
  }else{
    $(cell).css("font-style","normal");
  }
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].italic = isItalic;

})

$("#underline").on("click",function () {
  $(this).toggleClass("isOn");

  let isUnderline = $(this).hasClass("isOn");
  let cell = $(".cell.selected");
  if(isUnderline){
    $(cell).css("text-decoration","underline");
  }else{
    $(cell).css("text-decoration","none");
  }
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].underline = isUnderline;

})

$("#font").on("change", function () {
  let val = $(this).val();
  console.log(val);
  let cell = $(".cell.selected");
  cell.css("font-family",val);
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].fontStyle = val;
})

$("#color").on("change", function () {
  let val = $(this).val();
  console.log(val);
  let cell = $(".cell.selected");
  cell.css("color",val);
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].color = val;
})

$("#font-size").on("change", function () {
  let val = Number($(this).val());
  console.log(val);
  let cell = $(".cell.selected");
  cell.css("font-size",val);
  let {rowId, colId} = getrc(cell);
  db[rowId][colId].fontSize = val;
})

/*********************** Menu options end *******************/

  $(".cell").on("click", function () {

    $("#address-input").val(getAddress(this));
    if(lastClickedCell){
      $(lastClickedCell).removeClass("selected");
    }
    $(this).addClass("selected");
    let {rowId,colId} = getrc(this);
    $("#formula-input").val(db[rowId][colId].formula);
    let isBold = db[rowId][colId].bold;
    if(isBold) {
      $("#bold").addClass("isOn");
    }else{
      $("#bold").removeClass("isOn");
    }
    let isItalic = db[rowId][colId].italic;
    if(isItalic) {
      $("#italic").addClass("isOn");
    }else{
      $("#italic").removeClass("isOn");
    }
    let isUnderline = db[rowId][colId].underline;
    if(isUnderline) {
      $("#underline").addClass("isOn");
    }else{
      $("#underline").removeClass("isOn");
    }
    $("#font").val(db[rowId][colId].fontStyle);
    $("#color").val(db[rowId][colId].color);
    $("#font-size").val(db[rowId][colId].fontSize.toString());
  })

  $(".cell").on("blur",function () {
    lastClickedCell = this;
    let {rowId, colId} = getrc(this);
    let cellValue = Number($(this).html());
    // if the value is still same in the cell don't do anything

    if(db[rowId][colId].data == cellValue){
      return ;
    }
    if(db[rowId][colId].formula){
      removeDownStream(rowId,colId);
    }
    db[rowId][colId].data = cellValue;
    updateDisplay(rowId, colId,cellValue);
    console.log(db[rowId][colId]);
    //update all other value related
  })

$("#formula-input").on("blur",function () {
  let formula = $(this).val();
  let {rowId,colId} = getrc(lastClickedCell);
  if(formula==db[rowId][colId].formula ){
    return ;
  }
  removeDownStream(rowId,colId);

  if(!checkFormulaValidity(formula)){
    alert("Formula Invalid");
    return ;
  }

    db[rowId][colId].formula = formula;
  setUpstreamAndDownStream(rowId,colId);

  let nVal = evaluate(formula);

  updateDisplay(rowId, colId, nVal);
  $(this).val("");
})

  function updateDisplay(rowId,colId,val) {
    let formula = db[rowId][colId].formula;
    let prevData = db[rowId][colId].data;
    db[rowId][colId].data = val;
    let element = $(`[rowid=${rowId+1}][colid=${colId+1}]`)
    $(element).html(db[rowId][colId].data);
    for(let i=0;i<db[rowId][colId].upStream.length;i++){
      let r = db[rowId][colId].upStream[i].rowId;
      let c = db[rowId][colId].upStream[i].colId;
      let val = evaluate(db[r][c].formula);
      updateDisplay(r,c,val);
    }
    if(!val){
      db[rowId][colId].data = prevData;
    }
  }

  function checkFormulaValidity(formula) {
    return true;
  }

  function evaluate(formula) {

    let formulaArray = formula.split(" ");
    for(let i=0;i<formulaArray.length;i++){
      let c = formulaArray[i];
      if(isTerminal(c)){
        formulaArray[i] = getValueOfCellFromAddress(c);
      }
    }
    let expression = formulaArray.join("");
    return eval(expression);
  }
  function isTerminal(address) {
    let col = address.charCodeAt(0);
    if(col> 64 && col< 91){
      return true;
    }
    return false;
  }
  function getValueOfCellFromAddress(address) {
    let {row,col} = getrcFromAddress(address);
    return db[row][col].data;
  }
  function getrcFromAddress(address) {

      let col = parseInt(address.charCodeAt(0)-65);
      let row = parseInt(address.slice(1,address.length))-1;
      return {row,col};
  }
  function removeDownStream(rowId, colId) {
    let formula = db[rowId][colId].formula;
    let formulaArray = formula.split(" ");

    // ye cell jin pr depend krta h, unke upstream se iski entry hta lo
    for(let i=0;i<formulaArray.length;i++){
      let c = formulaArray[i];
      if(isTerminal(c)){
        let {row, col} = getrcFromAddress(c);
        let downStreamObject = db[row][col];
        downStreamObject.upStream.filter((obj)=>{
          return !(obj.rowId==rowId && obj.colId==colId);
        })
      }
    }
    // iss cell k downStream ko khali kro
    db[rowId][colId].downStream = [];


  }

function setUpstreamAndDownStream(rowId, colId) {
  let formula = db[rowId][colId].formula;
  let formulaArray = formula.split(" ");

  // ye cell jin pr depend krta h, unke upstream se iski entry hta lo
  for(let i=0;i<formulaArray.length;i++){
    let c = formulaArray[i];
    if(isTerminal(c)){
      let {row, col} = getrcFromAddress(c);
      let obj = {
        "rowId" : row,
        "colId" : col,
      }
      db[rowId][colId].downStream.push(obj);
      db[row][col].upStream.push({
        "rowId" : rowId,
        "colId" : colId,
      });
    }
  }
}

  function getAddress(element) {
    let {rowId,colId} = getrc(element);
    let address = String.fromCharCode(colId+65)+(rowId+1);
    return address;
  }
  function getrc(element) {
   let rowId = Number($(element).attr("rowId")-1);
   let colId = Number($(element).attr("colId")-1);
   return {
     rowId,
     colId};
  }

  function init() {
    $("#File").click();
    $("#New").click();
    $(".cell")[28].click();

  }
  init();
})
