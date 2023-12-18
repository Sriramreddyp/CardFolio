const jwt = require("jsonwebtoken");

//* For authorizing docter cookie
function authorizationDoctor(req, res, next) {
  const token = req.cookies.access_token_doctor;
  if (!token) {
    res.redirect("/doctor");
  } else {
    try {
      const data = jwt.verify(token, process.env.REFRESH_TOKEN_DOCTOR);
      req.docter_id = data.doc;
      return next();
    } catch {
      res.redirect("/doctor");
    }
  }
}

//** function for login redirection - doctor */
function loginRedirectDocter(req, res, next) {
  const token = req.cookies.access_token_docter;
  console.log(token);
  if (token) {
    res.redirect("/doctor/dash");
  } else {
    return next();
  }
}

//* For authorizing docter cookie
function authorizationUser(req, res, next) {
  const token = req.cookies.access_token_user;
  if (!token) res.redirect("/user");
  else {
    try {
      const data = jwt.verify(token, process.env.REFRESH_TOKEN_USER);
      req.user_id = data.user;
      return next();
    } catch {
      res.redirect("/user");
    }
  }
}

//** function for login redirection - user */
function loginRedirectUser(req, res, next) {
  const token = req.cookies.access_token_user;
  console.log(token);
  if (token) {
    res.redirect("/user/userInfo");
  } else {
    return next();
  }
}

//*For authorizing both docter and user cookie
function authorizationDocAndUser(req, res, next) {
  const docterToken = req.cookies.access_token_doctor;
  const docterUser = req.cookies.access_token_user;
  if (!docterToken || !docterUser);
  else {
    try {
      const docterData = jwt(docterToken, process.env.REFRESH_TOKEN_DOCTOR);
      const userData = jwt(userToken, process.env.REFRESH_TOKEN_USER);
      req.docter_id = docterData.doc;
      req.user_id = userData.user;
      return next();
    } catch {
      res.status(500).json({ status: "Can't access without cookie data" });
    }
  }
}

//* For login Authentication for Pharmacist
function loginRedirectPharmacist(req, res, next) {
  const token = req.cookies.access_token_pharmacist;
  console.log(token);
  if (token) {
    res.redirect("/phar/dash");
  } else {
    return next();
  }
}

//* For authorizing pharmacist cookie
function authorizationPhar(req, res, next) {
  const token = req.cookies.access_token_pharmacist;
  if (!token) {
    res.redirect("/phar");
  } else {
    try {
      const data = jwt.verify(token, process.env.REFRESH_TOKEN_PHARMACIST);
      req.pharmacist_id = data.pharmacist;
      return next();
    } catch {
      res.redirect("/phar");
    }
  }
}

module.exports = {
  authorizationDoctor,
  authorizationUser,
  authorizationDocAndUser,
  loginRedirectPharmacist,
  loginRedirectDocter,
  authorizationUser,
  loginRedirectUser,
  authorizationPhar,
};
