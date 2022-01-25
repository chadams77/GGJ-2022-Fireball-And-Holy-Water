window.GLSL_INSERT = {
    FLOAT: (val) => {
        let str = `${val||0.}`;
        return (str.indexOf('.') === -1) ? str + '.' : str;
    },
    VEC2: (val) => `vec2(${GLSL_INSERT.FLOAT(val.x)},${GLSL_INSERT.FLOAT(val.y)})`,
    VEC3: (val) => `vec3(${GLSL_INSERT.FLOAT(val.x)},${GLSL_INSERT.FLOAT(val.y)},${GLSL_INSERT.FLOAT(val.z)})`,
    VEC4: (val) => `vec4(${GLSL_INSERT.FLOAT(val.x)},${GLSL_INSERT.FLOAT(val.y)},${GLSL_INSERT.FLOAT(val.z)},${GLSL_INSERT.FLOAT(val.w)})`,
    PAL3: (pal, tVar) => `mix(${GLSL_INSERT.VEC3(pal[0])}, mix(${GLSL_INSERT.VEC3(pal[1])}, ${GLSL_INSERT.VEC3(pal[2])}, clamp(2. * (${tVar}) - 1., 0., 1.)), clamp(2. * (${tVar}), 0., 1.))`
};