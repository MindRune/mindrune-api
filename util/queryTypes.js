const spamProtection = require('./spamProtection')
const queryDB = require("./queryDB");

const queryTypes = [
  {
    name: 'spamProtection',
    getData: (request, account) => spamProtection(request, account)
  },
  {
    name: "queryDB",
    getData: (query, params, db) => queryDB(query, params, db),
  }
]

module.exports = {
  spamProtection: function spamProtection () {
    return queryTypes[0]
  },
  queryDB: function queryDB() {
    return queryTypes[1];
  }
}
