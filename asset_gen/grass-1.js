const vgen = require('./lib/generate');

const main = async () => {
    await vgen.GenerateVoxels('grass-1', {
        size: 128,
        customFns: `
            float bump(vec3 p) {
                return (snoise(p/17.7) * 5. + snoise(p/55.7) * 2.5) / 7.5;
            }
        `,
        distFn: `
            p.y = -p.y;
            ret = sdBoxSigned(p, vec3(0., 40., 0.), vec3(105., 20., 105.)) + bump(p) * 7.5;
        `,
        colorFn: `
            p.y = -p.y;
            ret.rgb = mix(vec3(0.1, 0.65, 0.15)*0.35, vec3(0.1, 0.65, 0.15), pow(bump(p)*0.5+0.5, 4.));
        `
    });
};

main();