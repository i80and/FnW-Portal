import * as THREE from "three";

export function SphericalCloud (numPoints, rho, color) {

    const geometry = new THREE.Geometry();

    const l = numPoints;
    for (let i = 0; i < numPoints; i++) {

        let vertex = new THREE.Vector3();

        const phi = Math.acos( - 1 + ( 2 * i ) / l );
        const theta = Math.sqrt( l * Math.PI ) * phi;

        vertex.setFromSphericalCoords(rho, phi, theta);

        geometry.vertices.push(vertex);
    }

    let particles = new THREE.Points(geometry, new THREE.PointsMaterial({color: color}));

    return particles;
}