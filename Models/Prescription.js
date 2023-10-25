const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//** Define the Diagnosis schema
const diagnosisSchema = new Schema({
    disease: { type: String, required: true },
    medicines: [
        {
        name: { type: String, required: true },
        status: { type: Boolean, required: true },
        },
    ],
});

//** Define the User schema
const PresSchema = new Schema({
    user_id: { type: mongoose.Types.ObjectId, required: true },
    doctor_id: { type: String, required: true },
    timestamp: {type: String,required: true},
    diagnosis: [diagnosisSchema], // Embed the Diagnosis schema as an array
});

//** Create a User model using the User schema
const PresModel = mongoose.model("PresModel", PresSchema);

module.exports = PresModel;