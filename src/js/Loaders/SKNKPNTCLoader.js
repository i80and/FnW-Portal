import {FileLoader} from 'three';

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

export function loadPointCloud(url, onHeaderReadCallback, onPointCallback) {
    const loader = new FileLoader();
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