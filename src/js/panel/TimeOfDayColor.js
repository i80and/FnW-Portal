/**
 * Get the current time of day as fraction of the total time of day.
 * ex) 12 Noon returns 0.5, Midnight returns 1.
 *
 * @returns {float} the percentage of the day that has passed.
 */
function FractionOfDay() {

    const secondsInADay = 24 * 60 * 60;
    const now = new Date();
    const hours = now.getHours() * 60 * 60;
    const minutes = now.getMinutes() * 60;
    const seconds = now.getSeconds();
    const totalSeconds = hours + minutes + seconds;
    const percentSeconds = totalSeconds/parseFloat(secondsInADay);

    return percentSeconds;
}

/**
 * Get an HSV color where Hue is determined by a fraction between zero and one.
 * Saturation is fixed at 100% and Value is fixed at 50%.
 *
 * @param {float} fraction a value between zero and one.
 * @return {{s: *, v: *, h: *}} HSV color using the convention of H ∈ [0,360], S ∈ [0,255], H ∈ [0,255]
 */
function HSVByFraction( fraction ){

    const h = fraction*360.0;
    const s = 255.0;
    const v = 225.0;

    return {h: h, s: s, v: v};
}

/**
 *  Convert an HSV color to an RGB color.
 *
 *  RGBA color convention: R, G, B ∈ [0,360], A ∈ [0,1]
 *  HSV color convention: S, V ∈ [255,255], H ∈ [0,360] (units of degrees)
 *
 * @param hsv
 * @returns {{r: number, b: number, g: number}} RGBA color using the convention of R, G, B ∈ [0,360], A ∈ [0,1].
 */
function HSVToRGB( hsv ) {
    let r, g, b;

    let h = hsv.h/360.0;
    let s = hsv.s/255.0;
    let v = hsv.v/255.0;

    let i = Math.floor(h * 6.0);
    let f = h * 6.0 - parseFloat(i);
    let p = v * (1.0 - s);
    let q = v * (1.0 - f * s);
    let t = v * (1.0 - (1.0 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return {r: r*255.0, g: g*255.0, b: b*255.0}
}

/**
 * Convert an RGBA object literal of the form {a: number, r: number, b: number, g: number}
 * to a stylesheet friendly string.
 *
 * @param {{a: number, r: number, b: number, g: number}} rgba_color RGBA color as object literal.
 * @returns {string} string in "(r, g, b, a)" suitable for stylesheet use.
 */
function RGBAToCssStyle( rgba_color ){

    const r = parseInt(rgba_color.r);
    const g = parseInt(rgba_color.g);
    const b = parseInt(rgba_color.b);
    const a = rgba_color.a;


    return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * Get a color based on the time of day.
 *
 * ex)
 *  6 AM => Green
 *  Noon => Cyan
 *  6 PM => Purple
 *  Mignight => Red
 *
 * @param {number} alpha transparency of the resulting color.
 * @returns {string} a stylesheet friendly rgba string.
 */
function TimeOfDayColor(alpha){

    let hsv = HSVByFraction( FractionOfDay() );
    let rgb = HSVToRGB(hsv);
    let rgba = { r: (rgb.r), g: (rgb.g), b: (rgb.b), a: alpha };

    return RGBAToCssStyle( rgba );

}

export {TimeOfDayColor};