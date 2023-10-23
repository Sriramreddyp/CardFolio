const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const prescriptionSchema = new Schema({
  prescription_id: { type: mongoose.Types.ObjectId, required: true },
});

//** Define the Medical schema
const medicalSchema = new Schema({
  Body_weight: { type: Number, required: true },
  Body_height: { type: Number, required: true },
  Blood_Group: { type: String, required: true }, // Assuming Blood_Group is a string (e.g., "A+", "B-", etc.)
  Diabetic_Status: { type: Boolean },
  Cholestrol_level: { type: Number },
  prescription: [prescriptionSchema], // Embed the Prescription schema as an array
});

//** Define the User schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  id_card: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  medical: medicalSchema,
  status: { type: Boolean, default: false }, // Embed the Medical schema
});

//** Create a User model using the User schema
const UserModel = mongoose.model("UserModel", userSchema);

module.exports = UserModel;