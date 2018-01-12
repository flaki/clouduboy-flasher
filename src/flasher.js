'use strict';

let fs = require('fs');
let path = require('path');

let Avrgirl = require('avrgirl-arduino');
let exec = require('child-process-promise').exec;



function findArduboy() {
  return new Promise(function(resolve, reject) {
    Avrgirl.list(function(err, ports) {
      if (err) return reject(err);

      // Find (first) Arduboy device
      for (let p of ports) {
        const vId = parseInt(p.vendorId, 16)
        const pId = parseInt(p.productId, 16)

        // Bootloader mode
        if (vId === 0x2341 && pId === 0x8036) {
          console.log(`Found device in Bootloader mode @ ${p.comName}.`)
          return resolve(p.comName)
        }
        // Recovery mode
        if (vId === 0x2341 && pId === 0x0036) {
          console.log(`Found device in Recovery mode @ ${p.comName}.`)
          return resolve(p.comName)
        }

        // Plug & Play ID (Windows/Linux)
        if (typeof p.pnpId === 'string' && p.pnpId.match(/VID_2341&PID_(0|8)036/)) {
          console.log(`Found device via Plug & Play @ ${p.comName}.`)
          return resolve(p.comName);
        }
      }

      reject(new Error("Can't find any connected Arduboy device!"));
    });
  });
}


function flashArduboy(hex, port) {
  // Write hex data to temp file
  return hexToTemp(hex).then(hexfile => {
    const avrgirl = new Avrgirl({
      board: 'arduboy',
      port: port,
      debug: true
    });

    // Flash it like it's hot!
    return new Promise((resolve, reject) => {
      avrgirl.flash(hexfile, err => {
        if (err) reject(err);

        resolve();
      })
    });
  })
}

function hexToTemp(hex) {
  return new Promise( (resolve, reject) => {
    require('tmp').file((err, path, fd) => {
      if (err) return reject(err);

      console.log("Tempfile for HEX: ", path);

      fs.write(fd, hex, err => {
        if (err) return reject(err);
        resolve(path);
      });
    });
  });
}


// Find & flash Arduboy with the provided .hex
let abPort, abHex;

function main(hex) {
  return findArduboy()

  .then(function(port) {
    abPort = port;
    abHex = hex;

    return flashArduboy(abHex, abPort);

  }).catch(function(e) {
    console.log("Flashing failed: ", e.stack||e);
    throw e;
  });
}

module.exports = main;

module.exports.findArduboy = findArduboy;
module.exports.flashArduboy = flashArduboy;
