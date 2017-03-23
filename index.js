// USAGE: node index.js <infilename.csv>

"use strict"
let fs = require('fs');
let csv = require('fast-csv');
let XLSX = require('xlsx');
let cmd = require ('command-line-args');

let optionDefinitions = [
  { name: 'input', alias: 'i', type: String },
  { name: 'output', alias: 'o', type: String }
]

let options = cmd(optionDefinitions)

let inputFile = options.input
let outputFile
if (!options.output) {
  let splitPath = inputFile.split('/')
  let mainPath = splitPath[splitPath.length - 1]
  let outputName = mainPath.split('.')
  outputFile = outputName[0] + '_flattened.csv'
} else {
  outputFile = options.output
}

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