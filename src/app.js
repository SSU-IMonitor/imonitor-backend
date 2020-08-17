const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = require("./models");
db.sequelize.sync();

app.use(function(req, res) {
    res.status(404).json({ message: "Not Found Error" });
});

app.use(function(err, req, res, next) {
    res.status(500).json({ message: err.message });
});

module.exports = app;