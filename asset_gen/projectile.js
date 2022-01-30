const vgen = require('./lib/generate');

const main = async () => {
    await vgen.GenerateVoxels('fireball-yellow', {
        size: 64,
        distFn: `
            ret = length(p) - (22. + (snoise(p/7.57)*0.25 + snoise(p/2.63)*0.125) * 15.);
        `,
        colorFn: `
            float t = ((snoise(p/7.57)*0.5+0.5) * 0.25 + (snoise(p/2.63)*0.5+0.5) * 0.125) / (0.25+0.125);
            t = pow(t, 2.0);
            ret.rgb = mix(vec3(0.5, 0.25, 0.1), vec3(1., 1., 0.5), t);
        `
    });
    await vgen.GenerateVoxels('fireball-red', {
        size: 64,
        distFn: `
            ret = length(p) - (22. + (snoise(p/7.57)*0.25 + snoise(p/2.63)*0.125) * 15.);
        `,
        colorFn: `
            float t = ((snoise(p/7.57)*0.5+0.5) * 0.25 + (snoise(p/2.63)*0.5+0.5) * 0.125) / (0.25+0.125);
            t = pow(t, 2.);
            ret.rgb = mix(vec3(0.25, 0., 0.), vec3(1., 0.5, 0.1), t);
        `
    });
    await vgen.GenerateVoxels('rock', {
        size: 32,
        distFn: `
            ret = length(p) - (10. + (snoise(p/7.57)*0.5) * 5.);
        `,
        colorFn: `
            float t = ((snoise(p/7.57)*0.5+0.5) * 0.25 + (snoise(p/2.63)*0.5+0.5) * 0.125) / (0.25+0.125);
            ret.rgb = mix(vec3(0.5, 0.5, 0.5), vec3(0.8, 0.8, 0.8), t);
        `
    });
};

main();
