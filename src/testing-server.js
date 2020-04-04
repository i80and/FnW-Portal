const express = require('express');
const cors = require('cors');
const expressStaticGzip = require("express-static-gzip");
const fs = require('fs');
const https = require('https')
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.set('trust proxy');
app.use(cors());

const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'testing-certs', 'cert.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'testing-certs','cert.pem'))
};

console.log(path.join(__dirname, 'testing-certs', 'cert.key'));

// app.use(express.static(DIST_DIR));

app.use('/', expressStaticGzip(DIST_DIR, {
    enableBrotli: true,
    orderPreference: ['br']
}));

app.listen(port, function () {
    console.log('App listening on port: ' + port);
});