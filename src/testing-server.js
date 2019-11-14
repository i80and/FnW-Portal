const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https')
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.set('trust proxy');

const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'testing-certs', 'cert.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'testing-certs','cert.pem'))
};

console.log(path.join(__dirname, 'testing-certs', 'cert.key'));

app.use(express.static(DIST_DIR));

app.get('/', (req, res) => {
    res.sendFile(HTML_FILE);
});

const server = https.createServer(httpsOptions, app)
    .listen(port, () => {
        console.log('server running at ' + port)
    });