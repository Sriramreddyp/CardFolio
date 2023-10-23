const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DBOperations.js");
const jwt = require("jsonwebtoken");

//* Base Route
DocRouter.get("/", (req, res) => {
    res.send("Doctor Route is Working Fine!!");
});


DocRouter.post('/createDoctor',[
    body('service_id').exists().isLength({min:12, max:12}),
    body('pin').exists().isNumeric().isLength({min:5}),
    body('name').exists(),
    body('auth_id').exists().isLength({min:5, max:5})
], async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try{
        let checkInserted = await dboperations.createDocter(req.body.service_id,req.body.name,req.body.pin,req.body.auth_id);
    if (checkInserted == true) res.json({ status: "Values Inserted" });
    else res.json({ status: checkInserted });
    }catch(error){
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});

//* Login Route for Doctor Portal
DocRouter.post(
    "/login",
    [
        body("service_id", "Enter the service_id in required format")
        .exists()
        .isLength({ min: 12, max: 12 }),
        body("pin", "Plese enter the PIN in required format")
        .exists()
        .isNumeric()
        .isLength({ min: 6, max: 6 }),
    ],
    async (req, res) => {
        try {
        //? Validation Handling
        let errors = validationResult(req);
        if (!errors.isEmpty()) throw errors;

        console.log(errors);

        //? Grabbing values from req and database
        let doc_id = req.body.service_id;
        let pass = await dboperations.loginDoctor(doc_id);

        //? CheckUp for authenticity
        if (pass == false || pass != req.body.pin) {
            errors = "Invalid credentials";
            throw errors;
        }

        //?Cookie Generation
        jwt.sign(
            { doc: doc_id },
            process.env.REFRESH_TOKEN_DOCTOR,
            { expiresIn: "10m" },
            (err, token) => {
            if (err) {
                errors = err;
                throw errors;
            } else {
                res
                .cookie("access_token_doctor", token, {
                    httpOnly: true,
                    sameSite: "None",
                    secure: true,
                    maxAge: 24 * 60 * 60 * 1000,
                })
                .json({ status: "Login Sucessfull" });
            }
            }
        );
        } catch (errors) {
        res.json({ status: errors });
        }
    }
);

module.exports = DocRouter;