import * as THREE from 'three';
const DeviceOrientationControls = require('../thirdparty/Controls/DeviceOrientationControls');

import PanelBase from './LightPanelBase'

export default class LightPanelMobile extends PanelBase {

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
        this.controls.dispose();
    }

    controlsSetup = () => {
        this.controls = new DeviceOrientationControls( this.camera );
    };

    startAnimationLoop = () => {

        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
        this.renderer.render( this.scene, this.camera );

        this.updateEffects();
        this.renderEffects();

        this.controls.update();

    };

}