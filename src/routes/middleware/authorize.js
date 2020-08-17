const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    const authorization = req.headers["authorization"];
    if(authorization === undefined) res.status(401).json({ message: "Invalid Authorization Header" });

    const accessToken = authorization.split(" ")[1];
    if(accessToken === undefined) res.status(401).json({ message: "Invalid jwt token" });

    const decoded = jwt.verify(accessToken, "secret");
    res.locals.userId = decoded.userId;

    next();
}