import * as THREE from 'three';

import {CopyShader} from 'three/examples/jsm/shaders/CopyShader';
import {HorizontalBlurShader} from 'three/examples/jsm/shaders/HorizontalBlurShader';
import {VerticalBlurShader} from 'three/examples/jsm/shaders/VerticalBlurShader';
import {FilmShader} from 'three/examples/jsm/shaders/FilmShader';
import {LuminosityHighPassShader} from 'three/examples/jsm/shaders/LuminosityHighPassShader';

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import '../../css/fonts/Veger(light).ttf'
import '../../css/main.css'

import BadTVShader from '../thirdparty/BadTvShader';

const lightColor = 0x0099ff;
const DEFAULT_LAYER = 0;
const OCCLUSION_LAYER = 1;

const VolumetericLightShader = {
    uniforms: {
        tDiffuse: {value:null},
        lightPosition: {value: new THREE.Vector2(0.5, 0.5)},
        exposure: {value: 1},
        decay: {value: 1},
        density: {value: 6},
        weight: {value: 0.57},
        samples: {value: 30}
    },

    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tDiffuse;",
        "uniform vec2 lightPosition;",
        "uniform float exposure;",
        "uniform float decay;",
        "uniform float density;",
        "uniform float weight;",
        "uniform int samples;",
        "const int MAX_SAMPLES = 100;",
        "void main()",
        "{",
        "vec2 texCoord = vUv;",
        "vec2 deltaTextCoord = texCoord - lightPosition;",
        "deltaTextCoord *= 1.0 / float(samples) * density;",
        "vec4 color = texture2D(tDiffuse, texCoord);",
        "float illuminationDecay = 1.0;",
        "for(int i=0; i < MAX_SAMPLES; i++)",
        "{",
        "if(i == samples) {",
        "break;",
        "}",
        "texCoord += deltaTextCoord;",
        "vec4 sample = texture2D(tDiffuse, texCoord);",
        "sample *= illuminationDecay * weight;",
        "color += sample;",
        "illuminationDecay *= decay;",
        "}",
        "gl_FragColor = color * exposure;",
        "}"
    ].join("\n")
};
const AdditiveBlendingShader = {
    uniforms: {
        tDiffuse: { value:null },
        tAdd: { value:null }
    },

    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tAdd;",
        "varying vec2 vUv;",
        "void main() {",
        "vec4 color = texture2D(tDiffuse, vUv);",
        "vec4 add = texture2D(tAdd, vUv);",
        "gl_FragColor = color + add;",
        "}"
    ].join("\n")
};
const PassThroughShader = {
    uniforms: {
        tDiffuse: { value: null }
    },

    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "varying vec2 vUv;",
        "void main() {",
        "gl_FragColor = texture2D(tDiffuse, vec2(vUv.x, vUv.y));",
        "}"
    ].join("\n")
};

const BarrelDistortionShader = {
    uniforms: {
        tDiffuse: { value: null },
        strength: { value: 0.9 },
        height: { value: 1 },
        aspectRatio: { value: 1 },
        cylindricalRatio: { value: 0.4 }
    },
    vertexShader: [
        "uniform float strength;",          // s: 0 = perspective, 1 = stereographic
        "uniform float height;",            // h: tan(verticalFOVInRadians / 2)
        "uniform float aspectRatio;",       // a: screenWidth / screenHeight
        "uniform float cylindricalRatio;",  // c: cylindrical distortion ratio. 1 = spherical
        "varying vec3 vUV;",                // output to interpolate over screen
        "varying vec2 vUVDot;",             // output to interpolate over screen
        "void main() {",
        "gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));",
        "float scaledHeight = strength * height;",
        "float cylAspectRatio = aspectRatio * cylindricalRatio;",
        "float aspectDiagSq = aspectRatio * aspectRatio + 1.0;",
        "float diagSq = scaledHeight * scaledHeight * aspectDiagSq;",
        "vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));",
        "float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;",
        "float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);",
        "vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;",
        "vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);",
        "vUV.xy += uv;",
        "}"
    ].join("\n"),
    fragmentShader: [
        "uniform sampler2D tDiffuse;",      // sampler of rendered scene�s render target
        "varying vec3 vUV;",                // interpolated vertex output data
        "varying vec2 vUVDot;",             // interpolated vertex output data
        "void main() {",
        "vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;",
        "gl_FragColor = texture2DProj(tDiffuse, uv);",
        "}"
    ].join("\n"),
};

function BarrelDistionPass(hFOV, aspect) {
    const bpPass = new ShaderPass(BarrelDistortionShader);

    bpPass.uniforms[ "height" ].value =  Math.tan(THREE.Math.degToRad(hFOV / 2) )/ aspect;
    bpPass.uniforms[ "aspectRatio" ].value = aspect;

    return bpPass;
}

function VBlurPass(height) {
    const vBlur = new ShaderPass(VerticalBlurShader);
    const bluriness = 7;
    vBlur.uniforms.v.value = bluriness / height;

    return vBlur;
}
function HBlurPass(width) {
    const hBlur = new ShaderPass(HorizontalBlurShader);
    const bluriness = 7;
    hBlur.uniforms.h.value = bluriness / width;

    return hBlur;
}

function BadTVPass() {
    const badTVPass = new ShaderPass(BadTVShader);
    badTVPass.uniforms.distortion.value = 1.9;
    badTVPass.uniforms.distortion2.value = 1.2;
    badTVPass.uniforms.speed.value = 0.1;
    badTVPass.uniforms.rollSpeed.value = 0;

    return badTVPass;
}


function VLPass() {
    const vlPass = new ShaderPass(VolumetericLightShader);
    vlPass.needsSwap = false;

    return vlPass;
}

function FilmPass() {
    const filmPass = new ShaderPass(FilmShader);
    filmPass.uniforms.sCount.value = 1200;
    filmPass.uniforms.grayscale.value = false;
    filmPass.uniforms.sIntensity.value = 1.5;
    filmPass.uniforms.nIntensity.value = 0.2;

    return filmPass;
}

function OccComposer( scene, renderer, camera, occRenderTarget ){

    const hBlur = HBlurPass();
    const vBlur = VBlurPass();
    const badTVPass = BadTVPass();
    const vlPass = VLPass();

    const occlusionComposer = new EffectComposer(renderer, occRenderTarget);
    occlusionComposer.addPass( new RenderPass(scene, camera) );
    occlusionComposer.addPass(hBlur);
    occlusionComposer.addPass(vBlur);
    occlusionComposer.addPass(hBlur);
    occlusionComposer.addPass(vBlur);
    occlusionComposer.addPass(hBlur);
    occlusionComposer.addPass(badTVPass);
    occlusionComposer.addPass(vlPass);

    return occlusionComposer;
}

function MainComposer( scene, renderer, camera, occRenderTarget ) {
    // Blend occRenderTarget into main render target
    const blendPass = new ShaderPass(AdditiveBlendingShader);
    blendPass.uniforms.tAdd.value = occRenderTarget.texture;
    blendPass.renderToScreen = true;

    const bloomPass = new UnrealBloomPass(width / height, 0.5, .8, .3);
    const badTVPass = BadTVPass();
    const filmPass = FilmPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
    composer.addPass(badTVPass);
    composer.addPass(filmPass);
    composer.addPass(blendPass);

    return composer;
}

const CreatTextPanel = (text, details, color, x=0, y=0, z=0) => {

    const w = 200;
    const h = 120;

    const itemGeo = new THREE.PlaneGeometry(w, h);
    const itemMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.7, color: color, side: THREE.DoubleSide});

    var bitmap = document.createElement('canvas');
    var ctx = bitmap.getContext('2d');
    bitmap.width = w;
    bitmap.height = h;
    ctx.font = '24px verger-light';

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = "center";
    ctx.fillText(text, w/2, h*1/4);

    ctx.font = '12px verger-light';
    ctx.fillText(details, w/2, h*3/4);

    const itemTexture = new THREE.Texture(
        bitmap,
        null,
        THREE.ClampToEdgeWrapping,
        THREE.ClampToEdgeWrapping,
        null,
        THREE.LinearFilter
    );

    itemTexture.needsUpdate = true;
    itemMaterial.map = itemTexture;

    const itemMesh = new THREE.Mesh(itemGeo, itemMaterial);
    itemMesh.position.set(x, y, z);

    const occItemMaterial = new THREE.MeshBasicMaterial({color: lightColor});
    occItemMaterial.map = itemTexture;
    const occMesh = new THREE.Mesh(itemGeo, occItemMaterial);
    occMesh.layers.set(OCCLUSION_LAYER);
    occMesh.position.set(x, y, z);

    return {
        itemMesh: itemMesh,
        occMesh: occMesh,
    };
};

function UnderGlow(vlPass, obj){
    const lightSource = new THREE.Object3D();
    lightSource.position.x = 0;
    lightSource.position.y = -15;
    lightSource.position.z = -15;

    const p = lightSource.position.clone(),
        vector = p.project(obj),
        x = (vector.x + 1) / 2,
        y = (vector.y + 1) / 2;

    vlPass.uniforms.lightPosition.value.set(x, y);
}

export{ CreatTextPanel, UnderGlow, HBlurPass, VBlurPass, VLPass, BadTVPass, FilmPass, BarrelDistionPass, VolumetericLightShader, AdditiveBlendingShader, PassThroughShader};