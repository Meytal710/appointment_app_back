const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// import {format} from 'date-fns'


const AppointmentSchema = new Schema({
    title: {
        type: String,
        default: ""
    },
    startDate: {
        type: String,
        default: Date.now()
    },
    endDate: {
        type: String,
        default: Date.now()
    },
    attendees: {
        type: String,
        default: ""
    },
    subjectFields: {
        type: String,
        default: ""
    }
})

// we have the schema and now we actually creates the model
const Appointment = mongoose.model("Appointment", AppointmentSchema);

module.exports = Appointment; //export so I can use the model it in my application