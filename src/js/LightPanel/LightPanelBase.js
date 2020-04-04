import React, { Component } from "react";
import ReactDOM from "react-dom";

import * as THREE from 'three';
const TWEEN = require('@tweenjs/tween.js');

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import * as PANEL from './Effects/LightPanel.js'
import { SphericalCloud } from './Effects/SphereCloud'
import { SphereicalWireFrame } from "./Effects/SphereWireFrame";
import { TimeOfDayColor } from './Effects/TimeOfDayColor';
import { loadPointCloud } from '../Loaders/SKNKPNTCLoader';

import FnWTable from '../config/endpoints_list.json'
import BGDRCFile from '../../styles/assets/foo.bin';

const style = {
    height: '100vh',
    width: '100hw'
};

const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;

export default class LightPanel extends Component {

    constructor(props) {
        super(props);
    };

    componentDidMount() {
        this.sceneSetup();
        this.addSceneObjects();
        this.addEffects();
        this.loadTexture();
        window.addEventListener('resize', this.handleWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
    }

    setupMouseControls = () => {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    };

    onClick = ( event ) => {

        event.preventDefault();

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = ( event.clientX / this.mount.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / this.mount.clientHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse, this.camera );
        const intersects = raycaster.intersectObjects( this.objects );

        if ( intersects.length > 0 ) {

            intersects[0].object.callback();

        }

    };

    transform = ( duration = 2000 ) => {

        TWEEN.default.removeAll();

        for ( let i = 0; i < this.sceneObjs.length; i ++ ) {

            let object = this.sceneObjs[ i ];
            let target = this.sceneTargets[ i ];

            new TWEEN.default.Tween( object.position )
                .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
                .easing( TWEEN.default.Easing.Quadratic.InOut )
                .start();
        }

    };

    loadTexture = () => {
        this.sceneTargets = [];
        this.sceneObjs = [];

        let i = 0;
        let vertices = null;

        // Affine transportation of point cloud after loading.
        const postLoadTransform = (x, y, z, scale_factor = 75, theta = -Math.PI/2) => {

            // Manually determined re-scaling and centering step
            const x_prime = x * scale_factor;
            const y_prime = y * scale_factor;
            const z_prime = (z * scale_factor) - 313*scale_factor;

            // Rotations Theta radians about the X access
            const rotate_x = (x,y,z, theta) => {
                return x
            };

            const rotate_y = (x,y,z, theta) => {
                return y*Math.cos(theta) - z*Math.sin(theta);
            };

            const rotate_z = (x,y,z, theta) => {
                return y* Math.sin(theta) + z*Math.cos(theta);
            };

            return {
                x:  rotate_x(x_prime,y_prime,z_prime,theta),
                y:  rotate_y(x_prime,y_prime,z_prime,theta),
                z:  rotate_z(x_prime,y_prime,z_prime,theta),
            };

        };

        loadPointCloud(BGDRCFile, (nPoints) => {
            vertices = new Float32Array(nPoints * 3);
        },
        (x, y, z) => {

            let transformed = postLoadTransform(x,y,z);

            vertices[i] = transformed.x;
            vertices[i+1] = transformed.y;
            vertices[i+2] = transformed.z;

            i += 3;
        }).then(() => {

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

            const material = new THREE.PointsMaterial({
                color: 0x0033cc,
                opacity: 0.1,
                depthWrite: false,
                size: 0.5});

            const points = new THREE.Points( geometry, material );

            // const starting_geometry = new THREE.BufferGeometry();
            // const rand_vertices = vertices.map(element => element += (Math.random() - 0.5)*10000);
            //
            // starting_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( rand_vertices, 3 ) );
            // const starting_points = new THREE.Points( starting_geometry, material );

            // this.sceneObjs.push(starting_points);
            // this.sceneTargets.push(points);
            this.scene.add(points);

            // this.transform();
            console.log("Ready!")
        })
    };

    sceneSetup = () => {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;
        const aspect = width / height;

        this.fov = 90;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(this.fov, aspect, 1, 10000);

        this.camera.position.z = 0;

        this.renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        this.renderer.setSize( width, height );
        this.mount.appendChild( this.renderer.domElement );
    };

    addSceneObjects = () => {

        const NumberEntries = Object.keys(FnWTable).length;

        this.objects = [];

        FnWTable.forEach((obj,idx) => {

            // const panelHue = TimeOfDayColor(randomAlpha);
            const panelHue = 0x7fffff;

            const meshes = PANEL.CreatTextPanel(
                obj.text.toUpperCase(),
                obj.detail.toUpperCase(),
                panelHue
            );

            const phi = Math.acos( - 1 + ( 2 * idx ) / NumberEntries );
            const theta  = Math.sqrt( NumberEntries * Math.PI ) * phi;
            const rho = 300;

            meshes.itemMesh.position.setFromSphericalCoords( rho, phi, theta );
            meshes.itemMesh.lookAt(this.camera.position);

            meshes.occMesh.position.setFromSphericalCoords( rho, phi, theta );
            meshes.occMesh.lookAt(this.camera.position);

            meshes.itemMesh.callback = function(){
                open( obj.link, "_blank");
            };

            this.objects.push(meshes.itemMesh, meshes.occMesh);
            this.scene.add(meshes.itemMesh, meshes.occMesh);

        });

        // FnWTable.forEach((obj,idx) => {
        //
        //     const randomAlpha = ( Math.random() * 0.5 + 0.25 );
        //     const panelHue = TimeOfDayColor(randomAlpha);
        //
        //     const meshes = PANEL.CreatTextPanel(
        //         obj.text.toUpperCase(),
        //         obj.detail.toUpperCase(),
        //         panelHue
        //     );
        //
        //     const phi = (idx/NumberEntries)*2.0*Math.PI;
        //     const theta = Math.PI/2;
        //     const rho = 250;
        //
        //     meshes.itemMesh.position.setFromSphericalCoords( rho, phi, theta );
        //     meshes.itemMesh.lookAt(this.camera.position);
        //
        //     meshes.occMesh.position.setFromSphericalCoords( rho, phi, theta );
        //     meshes.occMesh.lookAt(this.camera.position);
        //
        //     this.scene.add(meshes.itemMesh, meshes.occMesh);
        //
        // });

    };

    addEffects = () => {

        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;
        const aspect = width / height;

        const hBlur = PANEL.HBlurPass(width);
        const vBlur = PANEL.VBlurPass(height);
        const vlPass = PANEL.VLPass();
        const bloomPass = new UnrealBloomPass(aspect, 0.5, .8, .3);
        const bpPass = new PANEL.BarrelDistionPass(this.fov, aspect);

        this.badTVPass = PANEL.BadTVPass();
        this.filmPass = PANEL.FilmPass();

        const occRenderTarget = new THREE.WebGLRenderTarget(width, height);

        this.occlusionComposer = new EffectComposer(this.renderer, occRenderTarget);
        this.occlusionComposer.addPass( new RenderPass(this.scene, this.camera) );
        this.occlusionComposer.addPass(bpPass);
        this.occlusionComposer.addPass(hBlur);
        this.occlusionComposer.addPass(vBlur);
        this.occlusionComposer.addPass(hBlur);
        this.occlusionComposer.addPass(vBlur);
        this.occlusionComposer.addPass(hBlur);
        this.occlusionComposer.addPass(this.badTVPass);
        // this.occlusionComposer.addPass(vlPass);

        // Blend occRenderTarget into main render target
        const blendPass = new ShaderPass(PANEL.AdditiveBlendingShader);
        blendPass.uniforms.tAdd.value = occRenderTarget.texture;
        blendPass.renderToScreen = true;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(bpPass);
        this.composer.addPass(bloomPass);
        this.composer.addPass(this.badTVPass);
        this.composer.addPass(this.filmPass);
        this.composer.addPass(blendPass);

        this.clock = new THREE.Clock(true);

    };

    handleWindowResize = () => {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;

        this.renderer.setSize( width, height );
        this.camera.aspect = width / height;

        this.camera.updateProjectionMatrix();
    };

    renderEffects = () => {
        this.renderer.render( this.scene, this.camera );
        TWEEN.default.update();

        this.camera.layers.set(OCCLUSION_LAYER);
        this.occlusionComposer.render();
        this.camera.layers.set(DEFAULT_LAYER);
        this.composer.render();
    };

    updateEffects = () => {
        const timeDelta = this.clock.getDelta();

        this.filmPass.uniforms.time.value += timeDelta;
        this.badTVPass.uniforms.time.value += 0.01;

    };

    render() {
        return <div style={style} onClick={(e) => this.onClick(e)} ref={ref => (this.mount = ref)} />;
    }
}
