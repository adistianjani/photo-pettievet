const express = require("express");
const mysql = require('mysql');
const fs = require('fs');
const multer = require('multer');
const app = express();
var cors = require("cors");
const path = require('path');

app.use(cors({ origin: true, credentials: true }));

// config photo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg');
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB in bytes
});

// config file doc pdf
// Konfigurasi penyimpanan
const storageFile = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'document/'); // Tentukan direktori tujuan pengunggahan file
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'file-' + uniqueSuffix + '.pdf'); // Tentukan nama file dengan ekstensi PDF
    }
});

// Filter untuk hanya menerima file dengan ekstensi PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed.'), false);
    }
};

// Konfigurasi multer
const uploadFile = multer({
    storage: storageFile,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file (5 MB)
    fileFilter: fileFilter
});


// dev
// const connection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "app-vet",
//     multipleStatements: true,
// });

// prod
const connection = mysql.createConnection({
    host: "34.173.104.131",
    user: "root",
    password: "qfuF@*4#7T0z/`3s",
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

/* GET home page. */
router.get("/", function(req, res, next) {
    return res.status(401).json({ message: "Halo, ini adalah URL base dari API pettie-vet" });
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
            console.log('Foto telah disimpan');
            res.status(200).json({
                message: 'Foto telah disimpan'
            })
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
app.post('/customer/emergencyreq/:id_vet/:id_pet', upload.single('photo'), (req, res) => {

    const emergency_req = {
        photo: req.file.path,
        keluhan: req.body.keluhan,
        lokasi: req.body.lokasi,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        waktu: moment().format('YYYY-MM-DD HH:mm'),
        status: 'Pending',
        id_vet: req.params.id_vet,
        id_pet: req.params.id_pet
    };

    connection.query('INSERT INTO emergency_req SET ?', emergency_req, (error, result) => {
        if (error) {
            console.error('Error saving emergency request to database: ', error);
            res.status(500).send('Error saving emergency request to database');
        } else {
            console.log('Emergency request saved to database.');
            res.status(200).send({
                message: 'Emergency req saved to database.',
                result: emergency_req
            });
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
                    res.contentType('image/jpeg');
                    res.send(data);
                }
            });
        }
    });
});


// upload foto klinik 
app.post('/vet/upload/photo/:id_vet', upload.single('photo'), (req, res) => {
    const vet = {
        id: req.params.id_vet,
        photo: req.file.path
    };

    connection.query('UPDATE users SET ? WHERE id = ?', [vet, req.params.id_vet], (error, result) => {
        if (error) {
            console.error('Error saving photo to database: ', error);
            res.status(500).send('Error saving photo to database');
        } else {
            console.log('Photo saved to database.');
            res.status(200).send({
                message: 'Photo saved to database.',
                result: vet
            });
        }
    });
});

// get foto
app.get('/vet/photo/:id_vet', (req, res) => {
    const id_vet = req.params.id_vet;

    connection.query('SELECT * FROM users WHERE id = ?', id_vet, (error, results) => {
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

// upload document klinik 
app.post('/vet/upload/doc/:id_vet', uploadFile.single('file'), (req, res) => {
    const vet = {
        id: req.params.id_vet,
        document: req.file.path
    };

    connection.query('UPDATE users SET ? WHERE id = ?', [vet, req.params.id_vet], (error, result) => {
        if (error) {
            console.error('Error saving File to database: ', error);
            res.status(500).send('Error saving File to database');
        } else {
            console.log('File saved to database.');
            res.status(200).send({
                message: 'File saved to database.',
                result: vet
            });
        }
    });
});

// show/show file doc
app.get('/vet/show/doc/:id_vet', (req, res) => {
    const id_vet = req.params.id_vet;

    // Lakukan pengambilan informasi file dokumen dari database berdasarkan id_vet
    connection.query('SELECT document FROM users WHERE id = ?', id_vet, (error, result) => {
        if (error) {
            console.error('Error retrieving file information: ', error);
            res.status(500).send('Error retrieving file information');
        } else {
            const relativeFilePath = result[0].document; // Path relatif file dokumen dari database
            const absoluteFilePath = path.resolve(__dirname, relativeFilePath); // Konversi path relatif menjadi path absolut

            // Mengirimkan file dokumen sebagai respons
            res.sendFile(absoluteFilePath, (error) => {
                if (error) {
                    console.error('Error sending file: ', error);
                    res.status(500).send('Error sending file');
                }
            });
        }
    });
});


// Memulai server Express.js
app.listen(8081, () => {
    console.log('Server Express berjalan di port 8081');
});