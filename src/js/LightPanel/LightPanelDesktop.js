import * as THREE from 'three';
const FirstPersonControls = require('three-first-person-controls')(THREE);

import PanelBase from './LightPanelBase'

export default class LightPanelDesktop extends PanelBase {

    constructor(props) {
        super(props);
    };

    componentDidMount() {
        super.componentDidMount();
        this.controlsSetup();
        this.startAnimationLoop();
    }

    componentWillUnmount() {
        super.componentWillUnmount();
    }

    controlsSetup = () => {
        this.controls = new THREE.FirstPersonControls(this.camera, this.mount);
        this.controls.enabled = true;
        this.controls.lookSpeed = 0.5; //Speed of Mouse Moving View
        this.controls.movementSpeed = 50; //Camera moving speed
        this.controls.noFly = false;
        this.controls.constrainVertical = false; //Constrained vertical

        let direction = this.camera.getWorldDirection().clone();
        let angle = direction.angleTo(new THREE.Vector3(1,0,0));  // Forward and X axis
        this.controls.lon = - angle * 180 / Math.PI;
    };

    startAnimationLoop = () => {

        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
        this.renderer.render( this.scene, this.camera );

        this.updateEffects();
        this.renderEffects();

        const timeDelta = this.clock.getDelta();
        this.controls.update(timeDelta);

    };

}