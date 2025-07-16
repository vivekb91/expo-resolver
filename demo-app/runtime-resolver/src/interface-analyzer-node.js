/**
 * Node.js-specific interface analyzer operations
 * This file contains require() calls that should not be bundled for web
 */

const fs = require('fs');
const path = require('path');

function loadModuleExports(modulePath) {
  delete require.cache[modulePath];
  return require(modulePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function resolvePath(...paths) {
  return path.resolve(...paths);
}

function joinPath(...paths) {
  return path.join(...paths);
}

function getDirname(filePath) {
  return path.dirname(filePath);
}

module.exports = {
  loadModuleExports,
  readFile,
  fileExists,
  resolvePath,
  joinPath,
  getDirname
};