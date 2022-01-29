const vgen = require('./lib/generate');

const genHands = async(type) => {
    await vgen.GenerateVoxels(`${type}-hands`, {
        size: 128,
        customFns: `
            ${type === 'skull' ? `
            vec3 hand1p = vec3(-15., 8., -30.);
            vec3 hand2p = vec3(15., -8., -20.);
            ` : ``}
            ${type === 'gdemon' ? `
            vec3 hand1p = vec3(-22., 8., -30.);
            vec3 hand2p = vec3(22., -8., -20.);
            ` : ``}

            float handsDist ( vec3 p ) {
                float ret = min(length(p - hand1p) - 5., length(p - hand2p) - 5.);
                ${type === 'gdemon' ? `
                ret -= 0.5 + (snoise(p/3.7671) * 0.5 + 0.5) * 1.;
                ` : ``}
                return ret;
            }
            float staffDist ( vec3 p ) {
                vec3 dir = normalize(hand1p - hand2p);
                vec3 p1 = hand1p + dir * 32.;
                vec3 p2 = hand2p - dir * 32.;
                return sdTaperedLine(p1, p2, 1.5, 1.5, p) - pow(snoise(p/3.763)*0.25+0.75, 3.)*2.;
            }
        `,
        distFn: `
            p.y = -p.y;
            ret = min(handsDist(p), staffDist(p));
        `,
        colorFn: `
            p.y = -p.y;
            ${type === 'skull' ? `
            if (handsDist(p) < staffDist(p)) {
                ret.rgb = vec3(0.8, 0.8, 0.8);
            }
            else {
                ret.rgb = vec3(0.5, 0.4, 0.05) * pow(snoise(p/3.763)*0.25+0.75, 3.);
            }
            `:``}
            ${type === 'gdemon' ? `
            if (handsDist(p) < staffDist(p)) {
                ret.rgb = vec3(0.05, 0.4, 0.05);
            }
            else {
                ret.rgb = vec3(0.9, 0.9, 0.9);
            }
            `:``}
        `
    });
    await vgen.GenerateVoxels(`${type}-hands-attack`, {
        size: 164,
        customFns: `
            ${type === 'skull' ? `
            vec3 hand1p = vec3(-8., 5., -50.);
            vec3 hand2p = vec3(12., -5., -10.);
            ` : ``}
            ${type === 'gdemon' ? `
            vec3 hand1p = vec3(-12., 5., -50.);
            vec3 hand2p = vec3(18., -5., -10.);
            ` : ``}

            float handsDist ( vec3 p ) {
                float ret = min(length(p - hand1p) - 5., length(p - hand2p) - 5.);
                ${type === 'gdemon' ? `
                ret -= 0.5 + (snoise(p/3.7671) * 0.5 + 0.5) * 1.;
                ` : ``}
                return ret;
            }
            float staffDist ( vec3 p ) {
                vec3 dir = normalize(hand1p - hand2p);
                vec3 p1 = hand1p + dir * 32.;
                vec3 p2 = hand2p - dir * 32.;
                return sdTaperedLine(p1, p2, 1.5, 1.5, p) - pow(snoise(p/3.763)*0.25+0.75, 3.)*2.;
            }
        `,
        distFn: `
            p.y = -p.y;
            ret = min(handsDist(p), staffDist(p));
        `,
        colorFn: `
            p.y = -p.y;
            ${type === 'skull' ? `
            if (handsDist(p) < staffDist(p)) {
                ret.rgb = vec3(0.8, 0.8, 0.8);
            }
            else {
                ret.rgb = vec3(0.5, 0.4, 0.05) * pow(snoise(p/3.763)*0.25+0.75, 3.);
            }
            `:``}
            ${type === 'gdemon' ? `
            if (handsDist(p) < staffDist(p)) {
                ret.rgb = vec3(0.05, 0.4, 0.05);
            }
            else {
                ret.rgb = vec3(0.9, 0.9, 0.9);
            }
            `:``}
        `
    });
}

const main = async () => {
    await genHands('skull');
    await genHands('gdemon');
};

main();
