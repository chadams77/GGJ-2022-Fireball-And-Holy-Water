const vgen = require('./lib/generate');
const THREE = vgen.THREE;

const size = 128;

Math.seedrand(3);

const main = async () => {
    let branch = [];
    let genBranch = (lev, pos, thick, len) => {
        const a2 = (Math.rand()*0.5+0.5) * Math.pow(lev+1, 3.) * Math.PI * 0.125;
        const a1 = Math.PI * 2. * (Math.rand()+1) / (lev+1);
        let ep = new THREE.Vector3(
            pos.x + 1.5 * Math.cos(a1) * Math.sin(a2) * len,
            pos.y - Math.abs(Math.cos(a2) * len),
            pos.z + 1.5 * Math.sin(a1) * Math.sin(a2) * len
        );
        branch.push({
            pos: pos.clone(), thick: Math.max(thick, 2), pos2: ep, thick2: Math.max(thick * 0.5, 2)
        });
        if (lev < 2) {
            let cnt = Math.rand()*3+2;
            while ((cnt--)>0) {
                genBranch(lev+1, ep.clone(), thick*0.5, len*(Math.rand()*0.4+0.4));
            } 
        }
    };
    genBranch(0, new THREE.Vector3(0, size/2, 0), size/12, size*2.5*(6+Math.rand()*2)/48);
    console.log(`Branches: ${branch.length}`);
    await vgen.GenerateVoxels('tree-1', {
        size: size,
        distFn: `
            vec3 pos1, pos2;
            float r1, r2;
            ${vgen.ITERATE((idx) => `
                pos1 = ${vgen.VEC3(branch[idx].pos)};
                pos2 = ${vgen.VEC3(branch[idx].pos2)};
                r1 = ${vgen.FLOAT(branch[idx].thick)};
                r2 = ${vgen.FLOAT(branch[idx].thick2)};
                ret = min(ret, sdTaperedLine(pos1, pos2, r1, r2, p));
            `, branch.length)}

            ret += snoise(p/${vgen.FLOAT(23.7/256*size)}) * ${vgen.FLOAT(size*0.015)};
        `,
        colorFn: `
            ret.rgb = mix(vec3(0.32, 0.20, 0.025), vec3(0.32, 0.20, 0.025)*0.3, pow(snoise(p/${vgen.FLOAT(23.7/256*size)})*0.5+0.5, 3.));
        `
    });
};

main();
