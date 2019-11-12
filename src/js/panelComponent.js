// import fs from 'fs';

import React, { Component } from "react";
import ReactDOM from "react-dom";

import * as THREE from 'three';
const TWEEN = require('three-tween');
const TrackballControls = require('three-trackballcontrols');
import { CSS3DRenderer, CSS3DObject } from 'three-css3drenderer';

import { time_of_day_color } from './panel/time_of_day_colors';

import '../css/main.css';
import '../css/crt.css';
import '../css/panel.css';

import fnw_table from './config/endpoints_list.json'

class App extends Component {

    componentDidMount() {

        var camera, scene, renderer;
        var controls;

        const objects = [];
        const targets = { sphere: [] };

        function init(component) {

            camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
            camera.position.z = 3000;

            scene = new THREE.Scene();

            // Initialize Elements
            fnw_table.forEach(function(entry) {

                var element = document.createElement( 'div' );
                element.className = 'element';

                const random_alpha = ( Math.random() * 0.5 + 0.25 );
                const panel_hue = time_of_day_color(random_alpha);
                const panel_shadow_hue = time_of_day_color(0.8);

                element.style.setProperty('--panel-color', panel_hue);
                element.style.setProperty('--panel-shadow', panel_shadow_hue);

                element.style.setProperty('--animation-time', 10*Math.random() +'s')

                element.addEventListener( 'click', function () {
                    open( entry.link, "_blank");
                }, false );

                var details = document.createElement( 'div' );
                details.className = 'symbol';
                details.innerHTML = entry.text.toUpperCase();
                element.appendChild( details );

                var details = document.createElement( 'div' );
                details.className = 'details';
                details.innerHTML = entry.detail.toUpperCase();
                element.appendChild( details );

                var object = new CSS3DObject( element );
                object.position.x = Math.random() * 4000 - 2000;
                object.position.y = Math.random() * 4000 - 2000;
                object.position.z = Math.random() * 4000 - 2000;
                scene.add( object );

                objects.push( object );

            });


            // sphere

            var vector = new THREE.Vector3();

            for ( var i = 0, l = objects.length; i < l; i ++ ) {

                var phi = Math.acos( - 1 + ( 2 * i ) / l );
                var theta = Math.sqrt( l * Math.PI ) * phi;

                var object = new THREE.Object3D();

                object.position.setFromSphericalCoords( 600, phi, theta );

                vector.copy( object.position ).multiplyScalar( 2 );

                object.lookAt( camera.position );

                targets.sphere.push( object );
            }

            function point_at_camera(){
                objects.forEach(obj => {
                    obj.lookAt(camera.position);
                    obj.quaternion.copy( camera.quaternion );
                });
            }

            renderer = new CSS3DRenderer();
            renderer.setSize( window.innerWidth, window.innerHeight );
            component.mount.appendChild( renderer.domElement );

            controls = new TrackballControls( camera, renderer.domElement );
            controls.minDistance = 500;
            controls.maxDistance = 6000;
            controls.addEventListener( 'change', point_at_camera );
            controls.addEventListener( 'change', render );

            transform( targets.sphere, 2000 );

            window.addEventListener( 'resize', onWindowResize, false );

        }

        function transform( targets, duration ) {

            TWEEN.removeAll();

            for ( var i = 0; i < objects.length; i ++ ) {

                var object = objects[ i ];
                var target = targets[ i ];

                new TWEEN.Tween( object.position )
                    .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( object.rotation )
                    .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

            }

            new TWEEN.Tween( this )
                .to( {}, duration * 2 )
                .onUpdate( render )
                .start();

        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

            render();

        }

        function animate() {

            requestAnimationFrame( animate );

            TWEEN.update();

            controls.update();

        }

        function render() {
            renderer.render( scene, camera );
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