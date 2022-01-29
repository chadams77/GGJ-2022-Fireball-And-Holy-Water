const vgen = require('./lib/generate');

const genChest = async(type) => {
    await vgen.GenerateVoxels(`${type}-chest`, {
        size: 64,
        customFns: `
            float ribs(vec3 c, float radius, vec3 p) {
                p -= c - vec3(0., 0., radius);
                return length(vec2(length(p.xz) - radius, abs(p.y))) - 2.5${type === 'skull' ? ' * pow((atan(p.z, abs(p.x)) + PI*0.35) / PI, 0.1)' : ''};
            }
        `,
        distFn: `
            //p.y = -p.y;
            p.z += 32.;
            p.z /= 64.;
            p.z = pow(p.z, 0.5);
            p.z *= 69.;
            p.z -= 22. + 12.;
            p.y *= 0.8;
            p.z -= cos(PI * (p.y- -6.) / 32.) * 4.;
            p.z *= 1.8;
            p.z -= 20.;
            p.x *= 1.5;
            ${type === 'gdemon' ? `p.x /= 1.25; p.z *= 1.25;` : ``}
            ${type === 'ydemon' ? `p.x /= 1.35; p.z *= 1.35;` : ``}
            ret = ribs(vec3(0., -18., 20.), 17., p);
            ret = min(ret, ribs(vec3(0., -12., 20.), 22., p));
            ret = min(ret, ribs(vec3(0., -6., 20.), 18., p));
            ret = min(ret, ribs(vec3(0., 0., 20.), 14., p));
            ret = min(ret, ribs(vec3(0., 6., 20.), 10., p));
            ret = min(ret, sdTaperedLine(vec3(0., -28., 20.), vec3(0., ${type === 'skull' ? '20.' : '15.'}, 20.), 3., 3., p) - (1. * pow(sin(p.y/1.25)*0.5+0.5, 3.)));
            ${type === 'gdemon' ? `
            ret -= 3. + (snoise(p/3.7671) * 0.5 + 0.5) * 1.;
            ` : ``}
            ${type === 'ydemon' ? `
            ret -= 3. + (snoise(p/2.7671) * 0.5 + 0.5) * 1.5;
            ` : ``}
        `,
        colorFn: `
            //p.y = -p.y;
            p.z += 32.;
            p.z /= 64.;
            p.z = pow(p.z, 0.5);
            p.z *= 69.;
            p.z -= 22. + 12.;
            p.y *= 0.8;
            p.z -= cos(PI * (p.y- -6.) / 32.) * 4.;
            p.z *= 1.8;
            p.z -= 20.;
            p.x *= 1.5;
            ${type === 'gdemon' ? `p.x /= 1.25; p.z *= 1.25;` : ``}
            ${type === 'ydemon' ? `p.x /= 1.35; p.z *= 1.35;` : ``}
            ret.rgb = vec3(0.8, 0.8, 0.8);
            ${type === 'gdemon' ? `
            ret.rgb = mix(vec3(0.1, 0.4, 0.1), vec3(0.05, 0.2, 0.05), (snoise(p/3.7671) * 0.5 + 0.5));
            ` : ``}
            ${type === 'ydemon' ? `
            ret.rgb = mix(vec3(0.6, 0.6, 0.2), vec3(0.3, 0.3, 0.1), (snoise(p/2.7671) * 0.5 + 0.5));
            ` : ``}
        `
    });
}

const main = async () => {
    await genChest('skull');
    await genChest('gdemon');
    await genChest('ydemon');
};

main();
