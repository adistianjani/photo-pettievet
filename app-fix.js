const express = require("express");
const mysql = require('mysql');
const fs = require('fs');
const multer = require('multer');
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg');
    }
});

const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "app-vet",
    multipleStatements: true,
});

connection.connect((error) => {
    if (error) {
        console.error('Error connecting to database: ', error);
    } else {
        console.log('Connected to database.');
    }
});

// add foto di profil
app.put('/user/upload/photo/:id', upload.single('photo'), (req, res) => {
    const user = {
        id: req.params.id,
        photo: req.file.path
    };

    connection.query('UPDATE users SET ? WHERE id = ?', [user, req.params.id], (error, result) => {
        if (error) {
            console.error('Error saving user to database: ', error);
            res.status(500).send('Error saving user to database');
        } else {
            console.log('User saved to database.');
            res.send('User saved to database');
        }
    });
});

// get foto
app.get('/user/photo/:id', (req, res) => {
    const userId = req.params.id;

    connection.query('SELECT * FROM users WHERE id = ?', userId, (error, results) => {
        if (error) {
            console.error('Error retrieving user from database: ', error);
            res.status(500).send('Error retrieving user from database');
        } else {
            const user = results[0];

            fs.readFile(user.photo, (error, data) => {
                if (error) {
                    console.error('Error reading photo file: ', error);
                    res.status(500).send('Error reading photo file');
                } else {
                    res.contentType('image/jpeg');
                    res.send(data);
                }
            });
        }
    });
});

// foto emergency req
const moment = require('moment');

app.post('/customer/emergencyreq/:id_vet/:id_customer', upload.single('photo'), (req, res) => {
    const jenis_hewan = req.body.jenis_hewan;
    const validJenisHewan = ['kucing', 'anjing', 'Kucing', 'Anjing'];

    if (!validJenisHewan.includes(jenis_hewan.toLowerCase())) {
        return res.status(400).json({ message: 'Jenis hewan tidak valid' });
    }

    const emergency_req = {
        photo: req.file.path,
        jenis_hewan: jenis_hewan,
        keluhan: req.body.keluhan,
        lokasi: req.body.lokasi,
        waktu: moment().format('YYYY-MM-DD HH:mm'),
        id_vet: req.params.id_vet,
        id_customer: req.params.id_customer
    };

    connection.query('INSERT INTO emergency_req SET ?', emergency_req, (error, result) => {
        if (error) {
            console.error('Error saving emergency request to database: ', error);
            res.status(500).send('Error saving emergency request to database');
        } else {
            console.log('Emergency request saved to database.');
            res.send('Emergency request saved to database');
        }
    });
});


app.get('/vet/emergencyreq/:id', (req, res) => {
    const requestId = req.params.id;

    connection.query('SELECT * FROM emergency_req WHERE id = ?', [requestId], (error, results) => {
        if (error) {
            console.error('Error retrieving emergency request from database: ', error);
            res.status(500).send('Error retrieving emergency request from database');
        } else {
            if (results.length === 0) {
                return res.status(404).send('Emergency request not found');
            }

            const emergencyRequest = results[0];

            fs.readFile(emergencyRequest.photo, (error, data) => {
                if (error) {
                    console.error('Error reading photo file: ', error);
                    res.status(500).send('Error reading photo file');
                } else {
                    const base64Photo = Buffer.from(data).toString('base64');

                    const responseData = {
                        emergencyRequest: emergencyRequest,
                        photoData: base64Photo
                    };

                    res.contentType('application/json');
                    res.send(responseData);
                }
            });
        }
    });
});


// Memulai server Express.js
app.listen(8080, () => {
    console.log('Server Express berjalan di port 8080');
});