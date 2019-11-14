import {
    Gyroscope,
    AbsoluteOrientationSensor
} from 'motion-sensors-polyfill';

// Note the Generic Sensors API *requires* the use of HTTPS.
export default class OrientationControls {

    constructor(model) {
        this.model = model;

        if (navigator.permissions) {
            Promise.all([navigator.permissions.query({ name: "accelerometer" }),
                navigator.permissions.query({ name: "magnetometer" }),
                navigator.permissions.query({ name: "gyroscope" })])
                .then(results => {
                    if (results.every(result => result.state === "granted")) {
                        this.initSensor();
                    } else {
                        console.log("Permission to use sensor was denied.");
                    }
                }).catch(err => {
                console.log("Integration with Permissions API is not enabled, still try to start app.");
                this.initSensor();
            });
        } else {
            console.log("No Permissions API, still try to start app.");
            this.initSensor();
        }

        this.initSensor();
    }

    initSensor = () => {
        const options = { frequency: 60, referenceFrame: 'device' };

        this.sensor = new AbsoluteOrientationSensor(options);
        this.sensor.onreading = () => this.model.quaternion.fromArray(this.sensor.quaternion).inverse();
        this.sensor.onerror = (event) => {
            if (event.error.name === 'NotReadableError') {
                console.log("Sensor is not available.");
            }
        }
        this.sensor.start();
    }

}