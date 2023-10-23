const express = require('express');
const {body, validationResult} = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const Prescription = require('../Models/Prescription');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const fetchdoctor = require('../Middlewares/fetchdoctor');
const validators = require('../Operations/validation');
const UserModel = require('../Models/User');
dotenv.config();

router.post('/createUser',[
        body('name').isLength({min: 4}),
        body('id_no').isLength({min: 12}),
        body('password').isLength({min: 5}),
        body('weight').isNumeric(),
        body('height').isNumeric(),
        body('blood_grp').isLength({min:2, max:3}),
        body('diabetic').isBoolean(),
        body('cholestrol').isNumeric(),
    ],async (req,res)=>{
        // console.log('here');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        // res.send("done");
        // console.log('here1');

        try{
            let user = await User.findOne({id_card: req.body.id_no});
            if(user){
                res.status(400).json({error: 'User Already Exists'});
            }

            const salt = await bcrypt.genSalt(10);
            let secPass = await bcrypt.hash(req.body.password,salt);

            user = new User({name: req.body.name,
                id_card: req.body.id_no,
                password: secPass,
                medical: {
                    Body_weight: req.body.weight,
                    Body_height: req.body.height,
                    Blood_Group: req.body.blood_grp,
                    Diabetic_Status: req.body.diabetic,
                    Cholestrol_level: req.body.cholestrol,
                    prescription: [],
                },
                status: true
            });

            const savedUser = await user.save();

            jwt.sign(
                { user: savedUser._id },
                process.env.REFRESH_TOKEN_USER,
                { expiresIn: "10m" },
                (err, token) => {
                if (err) {
                    errors = err;
                    throw errors;
                } else {
                    res
                    .cookie("access_token_user", token, {
                        httpOnly: true,
                        sameSite: "None",
                        secure: true,
                        maxAge: 24 * 60 * 60 * 1000,
                    })
                    .status(200)
                    .json({ status: "Creation & Login Sucessfull" });
                }
                }
            );
        }catch(error){
            console.error(error.message);
            res.status(500).send("Internal server error");
        }
});

router.post('/login',[
    body('id_no').isLength({min: 12}),
    body('password').exists(),
],
    async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        try{
            let user = await User.findOne({id_card: req.body.id_no});
            if(!user){
                res.status(400).json({error: 'Invalid Credentials'});
            }

            let pwdCompare = await bcrypt.compare(req.body.password,user.password);
            if(!pwdCompare){
                res.status(400).json({error: 'Invalid Credentials'});
            }

            jwt.sign(
                { user: user._id },
                process.env.REFRESH_TOKEN_USER,
                { expiresIn: "10m" },
                (err, token) => {
                if (err) {
                    errors = err;
                    throw errors;
                } else {
                    res
                    .cookie("access_token_user", token, {
                        httpOnly: true,
                        sameSite: "None",
                        secure: true,
                        maxAge: 24 * 60 * 60 * 1000,
                    })
                    .status(200)
                    .json({ status: "Login Sucessfull" });
                }
                }
            );
        }catch(error){
            console.error(error.message);
            res.status(500).send("Internal server error");
        }
});

router.post('/addprescription/:userid',[
    body('disease').exists(),
    body('medicines').exists()
],async (req,res)=>{
    try{
        let user = await User.findById(req.params.userid);
        if(!user){
            res.status(200).json({error: "User not found"});
        }

        // console.log(user);

        let medicines = validators.extractMedicines(req.body.medicines);
        let disease = req.body.disease;
        console.log(disease);
        console.log(medicines);
        // let doctor_id = req.doctor.doc_id;
        // let doctor_id = req.doctor_id;

        const prescription = new Prescription({
            user_id:"65335c38c8652c53c2c63638",
            doctor_id:"123456789234",
            diagnosis:[{disease,medicines}]
        });

        const pres_id = await prescription.save();

        console.log(pres_id);

        if(pres_id!=null){
            user.medical.prescription.push({pres_id});
            let newUser = await UserModel.findByIdAndUpdate(req.params.userid,{$set:user},{new: true});
            res.status(200).json({newUser});
        }else{
            res.status(400).json({error:"unable to store prescription"});
        }
    }catch(error){
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
});


module.exports = router;