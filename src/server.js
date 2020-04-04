const express = require('express');
const cors = require('cors');
const expressStaticGzip = require("express-static-gzip");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');
const ASSETS_DIR = path.join(DIST_DIR, '/assets');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.set('trust proxy');
app.use(cors());

app.use('/', expressStaticGzip(DIST_DIR, {
    enableBrotli: true,
    orderPreference: ['br']
}));

// app.use(express.static(DIST_DIR));
//
// app.get('/', (req, res) => {
//     res.sendFile(HTML_FILE);
// });

app.listen(port, function () {
    console.log('App listening on port: ' + port);
});
