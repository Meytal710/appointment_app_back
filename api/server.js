const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const moment = require('moment'); 
moment().format();

const app = express();

app.use(express.json());
app.use(cors());
const API_PORT = process.env.PORT || 3001; // api from environment or 3001 defult

// const ObjectId = mongoose.Types.ObjectId;


// mongoose.connect("mongodb://127.0.0.1:27017/appointments-db")
// .then(() => console.log('connected to mongoDB'))
// .catch(console.error);

mongoose.connect("mongodb+srv://mongoAppointment:OEKr9SuWfW7PUWY7@cluster0.5ukqguz.mongodb.net/")
.then(() => console.log('connected to mongoDB'))
.catch(console.error);

const Appointment = require('./models/appointment.js');

// This function check 2 things:
// 1. if the start time is after the end time, or if start time or end time is not provided by the user, or if it's the same time
// 2. if trying to create an appointment in a time that overlap with exciting one in the database
// if the ID == -1 that means the call is from a requst to add new appointment, else it's from update requst
const checkInvalidDate = async (startDate, endDate, idForUpdateCase) => {
    var isTimeError = {bool: false, messege: ""};

    // part 1
    if ((moment(startDate).isAfter(endDate))) {
        isTimeError = {bool: true, messege: "Start Date cannot be after end date"};
    }
    else if ((endDate == "") || (startDate == "")){
        isTimeError = {bool: true, messege: "Please provide both Start Date and End Date"};
    }
    else if ((endDate == startDate)) {
        isTimeError = {bool: true, messege: "Start Date and End Date cannot be equal"};
    }
    else {
        // part 2

    const appointments = await Appointment.find().then(res => res); // gets all the appointments from the database

    appointments.forEach(function(appointment, index) {
        const currStartDate = appointment.startDate;
        const currEndDate = appointment.endDate;
        const currId = (appointment._id);

        // check for a gap between dates only for a different appointments than the current appointment
        if(!(idForUpdateCase == currId)) {
            if (((moment(endDate).isAfter(currStartDate)) && (moment(startDate).isBefore(currEndDate)))) {
                isTimeError = {bool: true, messege: "Overlap with another appointment time, please provide different start and end dates"};
            } else {
                isTimeError = {bool: false, messege: ""};
            }
        }
    });
    }

    return isTimeError;
}


// gets all the current appointments on the database
app.get('/appointments', async (req, res) => {
    const appointments = await Appointment.find();
    res.json(appointments);
});


// create a new appointment in the collection
app.post('/appointments/new', async (req, res) => {

    const promiseValue = await checkInvalidDate(req.body.startDate, req.body.endDate, -1).then(res => res); // get the value of the promise

    // check valid dates with checkInvalidDate
    if (promiseValue.bool) {
        return res.status(400).send({error: promiseValue.messege});
    } else {
        const appointment = new Appointment({
            title: req.body.title, // the title is required
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            attendees: req.body.attendees,
            subjectFields: req.body.subjectFields
        });
        appointment.save(); // saves the new appointment in the collection
        res.status(200).json(appointment); // pass back the new appointment so we can add it to the list on the client side
    }
});

// delete an appointment by id
app.delete('/appointments/delete/:id', async (req, res) => {
    const result = await Appointment.findByIdAndDelete(req.params.id);
    res.json(result);
});


// update an appointments
app.put('/appointments/update/:id', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    const promiseValue = await checkInvalidDate(req.body.startDate, req.body.endDate, req.params.id).then(res => res); // get the value of the promise

    // check valid dates
    if (promiseValue.bool) {
        return res.status(400).send({error: promiseValue.messege});
    }
    else {
        // check if the field has changed and if so assigning the new value, else staying with the previous value
        appointment.title = req.body.title ? req.body.title : appointment.title;
        appointment.startDate = req.body.startDate ? req.body.startDate : appointment.startDate;
        appointment.endDate = req.body.endDate ? req.body.endDate : appointment.endDate;
        appointment.attendees = req.body.attendees ? req.body.attendees : appointment.attendees;
        appointment.subjectFields = req.body.subjectFields ? req.body.subjectFields : appointment.subjectFields;

        appointment.save(); // saves that updated appointment on the collection
        res.status(200).json(appointment); // sends back to the client the updated appointment so the client updates the state
    }
});

app.listen(API_PORT, () => console.log(`server has started on port ${API_PORT}`));