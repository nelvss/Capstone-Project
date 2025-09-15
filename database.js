const fs = require('fs');
const path = require('path');
const Pool = require('pg').Pool;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "otgdatabase",
    password: "otgdatabase",
    port: 5432,
});
