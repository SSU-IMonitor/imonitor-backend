const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);

fs
    .readdirSync(__dirname)
    .filter(file => file.indexOf(".") !== 0 && file !== basename)
    .forEach(file => {
        require(path.join(__dirname, file))(router);
    });

module.exports = router;