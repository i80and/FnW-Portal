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

import FnWTable from '../config/endpoints_list.json'

import BGDRCFile from '../../styles/assets/foo.bin'

const style = {
    height: '100vh',
    width: '100hw'
};

const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;

function decodeFloat16(binary) {
    const exponent = (binary & 0x7C00) >> 10;
    const fraction = binary & 0x03FF;
    return (binary >> 15 ? -1 : 1) * (
        exponent ?
        (
            exponent === 0x1F ?
            fraction ? NaN : Infinity :
            Math.pow(2, exponent - 15) * (1 + fraction / 0x400)
        ) :
        6.103515625e-5 * (fraction / 0x400)
    );
}

function loadPointCloud(url, onHeaderReadCallback, onPointCallback) {
    const loader = new THREE.FileLoader();
    loader.setResponseType( 'arraybuffer' );
    return new Promise((resolve, reject) => {
        loader.load(url, (buffer) => {
            const view = new DataView(buffer);

            // Read and cut off the header
            const nPoints = view.getUint32(8, true);
            buffer = buffer.slice(12);

            const chunkLength = nPoints * 2;
            const xView = new Uint16Array(buffer.slice(0, chunkLength))
            const yView = new Uint16Array(buffer.slice(chunkLength, chunkLength * 2))
            const zView = new Uint16Array(buffer.slice(chunkLength * 2, chunkLength * 3))

            onHeaderReadCallback(nPoints);

            for (let i = 0; i < nPoints; i += 1) {
                const x = decodeFloat16(xView[i]);
                const y = decodeFloat16(yView[i]);
                const z = decodeFloat16(zView[i]);

                onPointCallback(x, y, z)
            }

            resolve()
        }, () => {}, reject)
    })
}

export default class LightPanel extends Component {

    constructor(props) {
        super(props);
    };

    componentDidMount() {
        this.sceneSetup();
        this.addSceneObjects();
        // this.addSphere();
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

    addSphere = () => {
        // const panelHue = TimeOfDayColor(0.8);
        const particles = SphericalCloud(2000, 300, 0x0099ff);
        this.scene.add(particles);
    };

    loadTexture = () => {
        this.sceneTargets = [];
        this.sceneObjs = [];

        let i = 0;
        let vertices = null;

        loadPointCloud(BGDRCFile, (nPoints) => {
            vertices = new Float32Array(nPoints * 3);
        },
        (x, y, z) => {
            vertices[i] = (x * 10) + 20;
            vertices[i+1] = (y * 10) + 13;
            vertices[i+2] = (z * 10) - 14;
            i += 3;
        }).then(() => {
            // gltf.scene.scale.multiplyScalar(2);

            // const box = new THREE.Box3().setFromObject( gltf.scene );
            // const center = box.getCenter( new THREE.Vector3() );

            // gltf.scene.position.x += ( gltf.scene.position.x - center.x );
            // gltf.scene.position.y += ( gltf.scene.position.y - center.y );
            // gltf.scene.position.z += ( gltf.scene.position.z - center.z );

            // gltf.scene.position.x += 20;
            // gltf.scene.position.y += 13;
            // gltf.scene.position.z -= 14;

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

            const material = new THREE.PointsMaterial({
                color: 0x0033cc,
                opacity: 0.1,
                depthWrite: false,
                size: 0.5});

            const points = new THREE.Points( geometry, material );

            this.sceneObjs.push(points);
            this.sceneTargets.push(points);
            this.scene.add(points);

            this.transform();
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
        // this.composer.addPass(bpPass);
        // this.composer.addPass(bloomPass);
        // this.composer.addPass(this.badTVPass);
        // this.composer.addPass(this.filmPass);
        // this.composer.addPass(blendPass);

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
