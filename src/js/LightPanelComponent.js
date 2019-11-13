// import fs from 'fs';

import React, { Component } from "react";
import ReactDOM from "react-dom";

import * as THREE from 'three';

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const TrackballControls = require('three-trackballcontrols');

import * as PANEL from './panel/LightPanel.js'
import { time_of_day_color } from './panel/time_of_day_colors';

import '../css/main.css';
import '../css/crt.css';
import fnw_table from './config/endpoints_list.json'

class App extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        const DEFAULT_LAYER = 0;
        const OCCLUSION_LAYER = 1;

        var camera, scene, renderer;
        var controls;
        var composer, occlusionComposer, filmPass, badTVPass;

        function init(component) {

            scene = new THREE.Scene();
            const fov = 110;
            const aspect = window.innerWidth / window.innerHeight;
            camera = new THREE.PerspectiveCamera( fov, aspect, 1, 10000 );
            camera.position.z = 500;

            const width = window.innerWidth;
            const height = window.innerHeight;

            const renderer = new THREE.WebGLRenderer({
                antialias: false
            });

            renderer.setSize(width, height);

            component.mount.appendChild( renderer.domElement );

            const l = Object.keys(fnw_table).length;
            fnw_table.forEach((obj,i) => {
                    const random_alpha = ( Math.random() * 0.5 + 0.25 );
                    const panel_hue = time_of_day_color(random_alpha);

                    let meshes = PANEL.CreatTextPanel(obj.text.toUpperCase(),
                        obj.detail.toUpperCase(),
                        panel_hue);

                    const phi =(i/l)*2.0*Math.PI;
                    const theta = Math.PI/2;
                    const rho = 300;

                    meshes.itemMesh.position.setFromSphericalCoords( rho, phi, theta );
                    meshes.itemMesh.lookAt(camera.position);

                    meshes.occMesh.position.setFromSphericalCoords( rho, phi, theta );
                    meshes.occMesh.lookAt(camera.position);

                    scene.add(meshes.itemMesh, meshes.occMesh);
                });

            const hBlur = PANEL.HBlurPass(width);
            const vBlur = PANEL.VBlurPass(height);
            const vlPass = PANEL.VLPass();
            const bloomPass = new UnrealBloomPass(width / height, 0.5, .8, .3);
            const bpPass = new PANEL.BarrelDistionPass(fov, aspect);

            badTVPass = PANEL.BadTVPass();
            filmPass = PANEL.FilmPass();

            const occRenderTarget = new THREE.WebGLRenderTarget(width, height);

            occlusionComposer = new EffectComposer(renderer, occRenderTarget);
            occlusionComposer.addPass( new RenderPass(scene, camera) );
            occlusionComposer.addPass(hBlur);
            occlusionComposer.addPass(vBlur);
            occlusionComposer.addPass(hBlur);
            occlusionComposer.addPass(vBlur);
            occlusionComposer.addPass(hBlur);
            occlusionComposer.addPass(badTVPass);
            occlusionComposer.addPass(vlPass);

            // Blend occRenderTarget into main render target
            const blendPass = new ShaderPass(PANEL.AdditiveBlendingShader);
            blendPass.uniforms.tAdd.value = occRenderTarget.texture;
            blendPass.renderToScreen = true;

            composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            composer.addPass(bloomPass);
            composer.addPass(badTVPass);
            composer.addPass(filmPass);
            composer.addPass(bpPass);
            composer.addPass(blendPass);

            controls = new TrackballControls( camera, renderer.domElement );
            controls.minDistance = 100;
            controls.maxDistance = 3000;
            // controls.addEventListener( 'change', point_at_camera );
            controls.addEventListener( 'change', render );

            window.addEventListener( 'resize', onWindowResize, false );

        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

        }

        function render() {

            occlusionComposer.render();
            composer.render();
        }

        const clock = new THREE.Clock(true);

        function update() {
            const timeDelta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            filmPass.uniforms.time.value += timeDelta;
            badTVPass.uniforms.time.value += 0.01;
        }

        function animate() {
            requestAnimationFrame(animate);
            update();
            render();
            controls.update();
        }

        init(this);
        animate();

    }

    render() {
        return (
            <div className='crt' ref={(mount) => { this.mount = mount }}/>
        )
    }
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
