const vgen = require('./lib/generate');

const genHead = async(type) => {
    await vgen.GenerateVoxels(`${type}-head`, {
        size: type === 'rdemon' ? 92 : 64,
        customFns: `
            ${type === 'skull' || type === 'gdemon' ? `
            vec3 eyeSock1P = vec3(4., 7., -5.5);
            vec3 eyeSock2P = vec3(-4., 7., -5.5);
            ` : `
            vec3 eyeSock1P = vec3(6., 7., -5.5);
            vec3 eyeSock2P = vec3(-6., 7., -5.5);
            `}

            float eyeDist(vec3 p) {
                return min(length(p - (eyeSock1P + vec3(0., 0., 0.))), length(p - (eyeSock2P + vec3(0., 0., 0.)))) - 4.;
            }
            
            float inPupil(vec3 p) {
                float d1 = length(p - (eyeSock1P + vec3(0., 0., 0.))) - 4.;
                float d2 = length(p - (eyeSock2P + vec3(0., 0., 0.))) - 4.;
                if (d1 <= 0. && abs(p.z-eyeSock1P.z) > 2.5) {
                    return 1.;
                }
                if (d2 <= 0. && abs(p.z-eyeSock2P.z) > 2.5) {
                    return 1.;
                }
                return 0.;
            }

            float hornDist(vec3 p, float r) {
                p.x *= 1.2;
                p = p.xzy;
                p.z -= r + 6.;
                return length(vec2(length(p.xz) - r, abs(p.y))) - r * 0.15 * max(-p.z / r, 0.);
            }
        `,
        distFn: `
            p.y = -p.y;
            if (p.y < 0.) {
                ${type === 'skull' ? `
                p.x = pow(abs(p.x)/24., 1./(1. + abs(p.y)/50.)) * 24. * (p.x < 0. ? -1. : 1.);
                p.z = pow(abs(p.z)/24., 1./(1. + abs(p.y)/50.)) * 24. * (p.z < 0. ? -1. : 1.);
                p.z += abs(p.y)/8.;
                ` : ``}
                ${type === 'gdemon' ? `
                p.x = pow(abs(p.x)/24., 1./(1. - abs(p.y)/100.)) * 24. * (p.x < 0. ? -1. : 1.);
                p.z = pow(abs(p.z)/24., 1./(1. - abs(p.y)/100.)) * 24. * (p.z < 0. ? -1. : 1.);
                p.z += abs(p.y)/8.;
                ` : ``}
                ${type === 'ydemon' ? `
                p.x = pow(abs(p.x)/24., 1./(1. - abs(p.y)/50.)) * 24. * (p.x < 0. ? -1. : 1.);
                p.z = pow(abs(p.z)/24., 1./(1. - abs(p.y)/50.)) * 24. * (p.z < 0. ? -1. : 1.);
                p.z += abs(p.y)/8.;
                ` : ``}
                ${type === 'rdemon' ? `
                p.x = pow(abs(p.x)/24., 1./(1. - abs(p.y)/25.)) * 24. * (p.x < 0. ? -1. : 1.);
                p.z = pow(abs(p.z)/24., 1./(1. - abs(p.y)/25.)) * 24. * (p.z < 0. ? -1. : 1.);
                p.z += abs(p.y)/8.;
                ` : ``}
            }
            vec3 hP = p * vec3(1., 0.65, 1.);
            float hDist = opSubtraction(length(hP) - 12., length(hP) - 9.);
            vec3 noseSock2P = (p - vec3(0., 0., -6.)) * vec3(1., 0.85, 1.);
            hDist = opSubtraction(hDist, length(p - eyeSock1P)-6.);
            hDist = opSubtraction(hDist, length(p - eyeSock2P)-6.);
            hDist = opSubtraction(hDist, length(noseSock2P)-5.);
            ${(type === 'gdemon' || type === 'ydemon' || type === 'rdemon') ? `
            hDist = min(hDist, length(noseSock2P*vec3(1., 1., 0.5))-5.);
            ` : ``}
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(0., -5., -24.), vec3(48., 2., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(2., -5., -24.), vec3(3., 6., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(-2., -5., -24.), vec3(3., 6., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(6., -5., -24.), vec3(3., 6., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(-6., -5., -24.), vec3(3., 6., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(10., -5., -24.), vec3(3., 6., 40.)));
            hDist = opSubtraction(hDist, sdBoxSigned(p, vec3(-10., -5., -24.), vec3(3., 6., 40.)));
            //hDist -= pow(snoise(p/2.) * 0.5 + 0.5, 2.5) * 1.25;
            ret = hDist;
            ${(type === 'gdemon' || type === 'ydemon' || type === 'rdemon') ? `
            ret = min(ret, eyeDist(p));
            ret = min(ret, hornDist(p, 24.));
            ${type === 'rdemon' ? `
            ret = min(ret, hornDist((p*vec3(0.75, 1., 1.))-vec3(0., -8., 0.), 32.));
            ` : ``}
            ` : ``}
        `,
        colorFn: `
            p.y = -p.y;
            if (p.y < 0.) {
                p.x = pow(abs(p.x)/24., 1./(1. + abs(p.y)/50.)) * 24. * (p.x < 0. ? -1. : 1.);
                p.z = pow(abs(p.z)/24., 1./(1. + abs(p.y)/50.)) * 24. * (p.z < 0. ? -1. : 1.);
                p.z += abs(p.y)/8.;
            }
            vec3 hP = p * vec3(1., 0.65, 1.);
            ret.rgb = vec3(0.8, 0.8, 0.8);
            ${(type === 'gdemon' || type === 'ydemon' || type === 'rdemon') ? `
            ${type === 'gdemon' ? `
            ret.rgb = mix(vec3(0.1, 0.4, 0.1), vec3(0.05, 0.2, 0.05), (snoise(p/3.7671) * 0.5 + 0.5));
            ` : `
            ret.rgb = mix(vec3(0.6, 0.6, 0.2), vec3(0.3, 0.3, 0.1), pow(snoise(p/2.7671) * 0.5 + 0.5, 2.));
            `}
            ${type === 'rdemon' ? `
            ret.rgb = mix(vec3(1.0, 0.2, 0.05), vec3(0.4, 0.05, 0.02), pow(snoise(p/2.7671) * 0.5 + 0.5, 2.));
            ` : ``}
            if (eyeDist(p) <= 0.) {
                if (inPupil(p) > .5) {
                    ret.rgb = vec3(0., 0., 0.);
                }
                else {
                    ret.rgb = ${type === 'gdemon' ? 'vec3(1., 1., 0.)' : type === 'ydemon' ? 'vec3(0., 1., 1.)' : type === 'rdemon' ? 'vec3(0., 0., 0.)' : ''};
                }
            }
            if (hornDist(p, 24.) <= 0.) {
                ret.rgb = vec3(1., 1., 1.);
            }
            ${type === 'rdemon' ? `
            if (hornDist((p*vec3(0.75, 1., 1.))-vec3(0., -8., 0.), 32.) <= 0.) {
                ret.rgb = vec3(1., 1., 1.);
            }
            ` : ``}
            if (sdBoxSigned(p, vec3(0., -5., -24.), vec3(24., 6., 40.)) < 0.) {
                ret.rgb = vec3(1., 1., 1.);
            }
            ` : ``}
        `
    });
}

const main = async () => {
    /*await genHead('skull');
    await genHead('gdemon');
    await genHead('ydemon');*/
    await genHead('rdemon');
};

main();
