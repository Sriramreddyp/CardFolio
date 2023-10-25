const express = require("express");
const { body, validationResult } = require("express-validator");
const DocRouter = express.Router();
const dboperations = require("../Operations/DBOperations.js");
const jwt = require("jsonwebtoken");
const User = require("../Models/User.js");
const Prescription = require("../Models/Prescription.js");
const validatingOperations = require('../Operations/validation.js');

//* Base Route
DocRouter.get("/", (req, res) => {
    res.send("Doctor Route is Working Fine!!");
});

// * doctor creation
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

//* UserInfo Retrieval Route
DocRouter.post(
    "/userInfo",
    [
        body("id", "Please enter the id in correct format")
            .exists()
            .isLength({ min: 12, max: 12 }),
        ],
        async (req, res) => {
        try {
            //? Validation Handling
            let errors = validationResult(req);
            if (!errors.isEmpty()) throw errors;
    
            // //?Cookies Generation and parsing
            jwt.sign(
            { user: req.body.id },
            process.env.REFRESH_TOKEN_USER,
            { expiresIn: "10m" },
            (err, token) => {
                if (err) {
                throw "Unable to create cookie";
                } else {
                res.cookie("access_token_user", token, {
                    httpOnly: true,
                    sameSite: "None",
                    secure: true,
                    maxAge: 24 * 60 * 60 * 1000,
                });
                }
            }
            );
    
            //? Retrieve Details
            const userInfo = await User.find({ id_card: req.body.id });
    
            // //? Handling User Exception of document not found
            if (userInfo.length == 0)
            throw "unable to find the user with given user_id";
    
            //?Consolidating information
            //! PROBLEM WITH PRESCRIPTION CONSOLIDATION
            const medicalInfo = userInfo[0].medical;
            const prescriptionInfo = medicalInfo.prescription;
            const prescriptions = [];
    
            for (let i = 0; i < prescriptionInfo.length; i++) {
            prescriptions.push(await UserModel.findById(prescriptionInfo[i].id));
            }
    
            //?Returning the consolidated information
            res.json({
            medical: medicalInfo,
            prescription_Info: prescriptionInfo,
            prescriptions: prescriptions,
            });
        } catch (msg) {
            res.clearcookie("access_token_user");
            res.status(500).json({ status: msg });
        }
        }
);
    
    //* Doc prescription addition route with user updation
    DocRouter.post(
        "/presAdd",
    
        [
        body("d_id", "Enter Docter_Id in correct format")
            .exists()
            .isLength({ min: 12, max: 12 }),
        body("u_id", "Enter the user_id in the correct format")
            .exists()
            .isLength({ min: 12, max: 12 }),
    
        body("medicines").exists(),
        body("diseases").exists(),
        ],
    
        async (req, res) => {
        try {
            //?validation handling
            let errors = validationResult(req);
            if (!errors.isEmpty()) throw errors;
    
            //? Retieving user details
            let user = await User.find({ id_card: req.body.u_id });
            if (!user) throw "User Not Found";
    
            //?Forming medicine object from comma seperated file and extracting disease
            let medicines = validatingOperations.extractMedicines(req.body.medicines);
            let disease = req.body.diseases;

            //?Creating and formatting date and time for prescription
            const currentDate = new Date();

            //? Create an instance of the Intl.DateTimeFormat object for the IST time zone.
            const istDateTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'long',
            });

            //? Format the current date and time in IST.
            const istDateAndTime = istDateTime.format(currentDate);
    
            //? Forming prescription schema
            const prescription = new Prescription({
            user_id: req.body.u_id,
            doctor_id: req.body.d_id,
            timestamp: istDateAndTime,
            diagnosis: [{ disease, medicines }],
            });
    
            //? Query Execution Handling
            try {
            const pres_id = await prescription.save();
            const id = pres_id._id;
    
            //?Updating the user with new prescription Id
            user[0].medical.prescription.push({ id });
    
            //? Updating the user with new prescription id's
            let newUser = await UserModel.findOneAndUpdate(
                { id_card: req.user_id },
                { $set: user[0] },
                { new: true }
            );
    
            res.status(200).json({ newUser });
            } catch (err) {
            res
                .status(400)
                .json({ status: "unable to store prescription", error: err });
            }
        } catch (err) {
            res
            .status(400)
            .json({ status: "unable to store prescription", error: err });
        }
        }
    );

module.exports = DocRouter;