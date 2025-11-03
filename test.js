// Test file for Claude GitHub App integration
// This file intentionally contains various code issues for Claude to review

/**
 * User management functions with intentional issues
 */

// Issue 1: No error handling and security vulnerability
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection risk
  const result = database.execute(query);
  return result[0].name; // Potential null reference error
}

// Issue 2: Performance issue with nested loops
function findDuplicates(arr1, arr2) {
  var duplicates = []; // Use var instead of const/let
  for (var i = 0; i < arr1.length; i++) {
    for (var j = 0; j < arr2.length; j++) {
      if (arr1[i] == arr2[j]) { // Using == instead of ===
        duplicates.push(arr1[i]);
      }
    }
  }
  return duplicates;
}

// Issue 3: Inconsistent naming and missing validation
function Process_User_Input(input) {
  // No input validation
  const result = input.trim().toLowerCase();
  return result;
}

// Issue 4: Promise without error handling
async function fetchUserProfile(id) {
  const response = await fetch(`https://api.example.com/users/${id}`);
  const data = await response.json(); // No error handling if response fails
  return data;
}

// Issue 5: Memory leak potential
let cache = {};
function addToCache(key, value) {
  cache[key] = value; // Cache never cleared, potential memory leak
}

// Issue 6: Callback hell
function processData(data, callback) {
  validateData(data, function(isValid) {
    if (isValid) {
      transformData(data, function(transformed) {
        saveData(transformed, function(saved) {
          callback(saved);
        });
      });
    }
  });
}

// Issue 7: Magic numbers and unclear logic
function calculateDiscount(price, customerType) {
  if (customerType === 1) {
    return price * 0.9; // What does 0.9 mean?
  } else if (customerType === 2) {
    return price * 0.8;
  } else if (customerType === 3) {
    return price * 0.7;
  }
  return price;
}

// Issue 8: Synchronous operation that should be async
function readConfigFile() {
  const fs = require('fs');
  const config = fs.readFileSync('./config.json', 'utf8'); // Blocking operation
  return JSON.parse(config);
}

// Export functions (some are undefined)
module.exports = {
  getUserData,
  findDuplicates,
  Process_User_Input,
  fetchUserProfile,
  addToCache,
  processData,
  calculateDiscount,
  readConfigFile
};
