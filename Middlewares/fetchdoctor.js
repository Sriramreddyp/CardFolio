const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

const fetchdoctor = (req, res, next) => {
    const token = req.cookies.access_token_doctor;
    if (!token) {
        res.json({ status: "Can't access without logging in" });
    }
    try {
        const data = jwt.verify(token, process.env.REFRESH_TOKEN_DOCTOR);
        req.docter = data.doc;
        next();
    } catch {
        res.json({ status: "Can't access without logging in" });
    }
};

module.exports = fetchdoctor;