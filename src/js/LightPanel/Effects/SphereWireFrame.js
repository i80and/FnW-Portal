import * as THREE from "three";

export function SphereicalWireFrame (segments, rings, rho, color) {

    let geometry = new THREE.SphereGeometry(rho, segments, rings);
    let material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true
    });
    return new THREE.Mesh(geometry, material);

}