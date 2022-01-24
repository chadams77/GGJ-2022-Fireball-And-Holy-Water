const vgen = require('./lib/generate');

const main = async () => {
    await vgen.GenerateVoxels('sphere', {
        size: 48,
        distFn: `
            ret = length(p) - 22.;
        `,
        colorFn: `
            ret.rgb = vec3(0.5, 0.5, 0.5);
        `
    });
};

main();
