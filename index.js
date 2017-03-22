// USAGE: node index.js <infilename.csv>

"use strict"
let fs = require('fs');
let csv = require('fast-csv');
let XLSX = require('xlsx');
let inputFile = process.argv[2]
let outputName = inputFile.split('.')
let outputFile = 'preprocessed_' + outputName[0] + '.csv'


////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////
// A thing for removing blanks from arrays:
function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

// a thing for getting an array of unique elements
function uniq(a) {
  return Array.from(new Set(a));
}

// a bigger thing for getting the number of months between two dates
var getMonthsBetween = function(date1, date2)
{
  'use strict';

  // Months will be calculated between start and end dates.
  // Make sure start date is less than end date.
  // But remember if the difference should be negative.
  var start_date = date1;
  var end_date = date2;
  var inverse = false;

  if (date1 > date2)
  {
      start_date = date2;
      end_date = date1;
      inverse = true;
  }

  end_date = new Date(end_date); //If you don't do this, the original date passed will be changed. Dates are mutable objects.
  end_date.setDate(end_date.getDate() + 1);

  // Calculate the differences between the start and end dates
  var yearsDifference = end_date.getFullYear() - start_date.getFullYear();
  var monthsDifference = end_date.getMonth() - start_date.getMonth();
  var daysDifference = end_date.getDate() - start_date.getDate();

  return (inverse ? -1 : 1) * (yearsDifference * 12 + monthsDifference + daysDifference/30); // Add fractional month
}

// a thing for translating most common boolean types
let boolStandard = { 
  "True": "true", 
  "False": "false",
  "Y": "true",
  "N": "false",
  "YES": "true",
  "NO": "false",
  "1": "true",
  "0": "false" 
}

// a thing for standardizing gender types
let gender = { 
  "M": "Male", 
  "F": "Female",
  "m": "Male",
  "f": "Female",
  "U": "Unknown",
  "u": "Unknown",
  "O": "Other",
  "o": "Other"
}

///////////////////////////////////////////////////
// END HELPERS
///////////////////////////////////////////////////

// read in the excel file
let workBook = XLSX.read(inputFile, {
  type: 'file'
})
// make a shell master header
let outHeader = [];
// read the individual tab/sheet names
let workSheets = workBook.SheetNames
// make a shell array to contain all the data
let sheets = []

// loop through each worksheet individually
for (let i = 0; i < workSheets.length; i++) {
  // convert the current sheet to JSON
  let sheetData = XLSX.utils.sheet_to_json(workBook.Sheets[workSheets[i]])
  // add the sheet name to each record in a new column:
  //sheetData['worksheet_name'] = workSheets[i]
  // add the json to the master array
  sheets.push(sheetData)
  // reconcile the header of the current sheet with the master sheet
  let headers = Object.keys(sheetData[0])
  headers.forEach(function (header) {
    if (outHeader.indexOf(header) === -1) {
      outHeader.push(header)
    }
  })
}

// open a write stream to the output file
let outputStream = csv.createWriteStream()
outputStream.pipe(fs.createWriteStream(outputFile, 'utf8'))
outputStream.write(outHeader.concat('worksheet_name'))

// loop through the data array
sheets.forEach(function (rows, i) {
  rows.forEach(function (row) {
    outputStream.write(outHeader.map(
      (header) => row[header] || ''
    ).concat([
      workSheets[i]
    ]))
  })
})

// close the write stream
outputStream.end();