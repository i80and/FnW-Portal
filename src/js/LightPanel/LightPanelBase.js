import React, { Component } from "react";
import ReactDOM from "react-dom";

import * as THREE from 'three';
const TWEEN = require('@tweenjs/tween.js');

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import * as PANEL from './Effects/LightPanel.js'
import { SphericalCloud } from './Effects/SphereCloud'
import { SphereicalWireFrame } from "./Effects/SphereWireFrame";
import { TimeOfDayColor } from './Effects/TimeOfDayColor';

import FnWTable from '../config/endpoints_list.json'
import BGTexGLTF from '../../styles/textures/choshi-otaki_falls_oirase_valley_aomori/scene.glb'

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
        this.addSphere();
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

        const loader = new GLTFLoader();

        this.sceneTargets = [];
        this.sceneObjs= [];

        loader.load( BGTexGLTF, ( gltf ) => {

                gltf.scene.scale.multiplyScalar(2);

                const box = new THREE.Box3().setFromObject( gltf.scene );
                const center = box.getCenter( new THREE.Vector3() );

                gltf.scene.position.x += ( gltf.scene.position.x - center.x );
                gltf.scene.position.y += ( gltf.scene.position.y - center.y );
                gltf.scene.position.z += ( gltf.scene.position.z - center.z );

                gltf.scene.position.x += 20;
                gltf.scene.position.y += 13;
                gltf.scene.position.z -= 14;

                let hueMaterial = new THREE.PointsMaterial({size: 0.0001,
                    color: 0x0033cc,
                    opacity: 0.1,
                    depthWrite: false});

                this.scene.add( gltf.scene );

                gltf.scene.traverse((o) => {

                    let object = new THREE.Points();
                    object.position.copy( o.position );

                    this.sceneTargets.push(object);

                    o.material = hueMaterial;

                    o.position.copy( this.camera.position );

                    o.position.x += (Math.random() - 0.5)*10000;
                    o.position.y += (Math.random() - 0.5)*10000;
                    o.position.z += (Math.random() - 0.5)*10000;

                    this.sceneObjs.push(o);
                });

                this.transform();


            }, undefined,
            ( error ) => {

                console.error( error );

            } );

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
        // this.composer.addPass(bloomPass);
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
