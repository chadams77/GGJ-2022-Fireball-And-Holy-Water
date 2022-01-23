const vgen = require('./lib/generate');

const main = async () => {
    await vgen.GenerateVoxels('rock-wall', {
        size: 128,
        customFns: `
            float bump(vec3 p) {
                return (snoise(p/13.7) * 5. + snoise(p/43.7) * 2.5) / 7.5;
            }
        `,
        distFn: `
            ret = sdBoxSigned(p, vec3(0.), vec3(105.)) + bump(p) * 7.5;
        `,
        colorFn: `
            ret.rgb = mix(vec3(0.5, 0.5, 0.5), vec3(0.1, 0.65, 0.15), pow(bump(p)*0.5+0.5, 4.));
        `
    });
};

main();