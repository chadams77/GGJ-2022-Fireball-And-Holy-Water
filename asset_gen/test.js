const vgen = require('./lib/generate');

const main = async () => {
    await vgen.GenerateVoxels('sphere', {
        size: 128,
        distFn: `
            ret = length(p) - 60.;
        `,
        colorFn: `
            ret.rgb = vec3(0.5, 0.5, 0.5);
        `
    });
};

main();
