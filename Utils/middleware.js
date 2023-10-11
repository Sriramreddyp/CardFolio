const jwt = require("jsonwebtoken");

const authorizationDoctor = (req, res, next) => {
  const token = req.cookies.access_token_doctor;
  if (!token) {
    res.json({ status: "Cant access without logging in" });
  }
  try {
    const data = jwt(token, process.env.REFRESH_TOKEN_DOCTOR);
    req.docter_id = data.doc;
    return next();
  } catch {
    res.json({ status: "Cant access without logging in" });
  }
};

module.export = { authorizationDoctor };
