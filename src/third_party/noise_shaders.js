window.GLSL_NOISE = `
    #define PI 3.14159265359
    #define E_CONST 2.71828182845904523536

    vec4 _R_SEED = vec4(123.77124171);

    float rand(vec2 co) {
        return fract(sin(dot(co.xy + _R_SEED.xy, vec2(12.9898,78.233))) * 43758.5453);
    }
    float rand(vec3 co) {
        return rand(vec2(co.x, rand(co.yz) * 43758.5453));
    }
    float rand(float co) {
        return rand(vec2(co));
    }

    mat4 rotationMatrix ( vec3 axis, float angle ) {
        axis = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float oc = 1.0 - c;
  
        return mat4(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
        0.0, 0.0, 0.0, 1.0);
    }

    vec3 worely_permute(vec3 x) {
        return mod((34.0 * x + 1.0) * x, 289.0);
    }

    vec3 worely_dist(vec3 x, vec3 y, vec3 z,  bool manhattanDistance) {
        return manhattanDistance ? abs(x) + abs(y) + abs(z) : (x * x + y * y + z * z);
    }

    vec2 worley(vec3 P, float jitter, bool manhattanDistance) {
        P += _R_SEED.xyz;

        float K = 0.142857142857;
        float Ko = 0.428571428571;
        float  K2 = 0.020408163265306;
        float Kz = 0.166666666667;
        float Kzo = 0.416666666667;

        vec3 Pi = mod(floor(P), 289.0);
        vec3 Pf = fract(P) - 0.5;

        vec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);
        vec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);
        vec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);

        vec3 p = worely_permute(Pi.x + vec3(-1.0, 0.0, 1.0));
        vec3 p1 = worely_permute(p + Pi.y - 1.0);
        vec3 p2 = worely_permute(p + Pi.y);
        vec3 p3 = worely_permute(p + Pi.y + 1.0);

        vec3 p11 = worely_permute(p1 + Pi.z - 1.0);
        vec3 p12 = worely_permute(p1 + Pi.z);
        vec3 p13 = worely_permute(p1 + Pi.z + 1.0);

        vec3 p21 = worely_permute(p2 + Pi.z - 1.0);
        vec3 p22 = worely_permute(p2 + Pi.z);
        vec3 p23 = worely_permute(p2 + Pi.z + 1.0);

        vec3 p31 = worely_permute(p3 + Pi.z - 1.0);
        vec3 p32 = worely_permute(p3 + Pi.z);
        vec3 p33 = worely_permute(p3 + Pi.z + 1.0);

        vec3 ox11 = fract(p11*K) - Ko;
        vec3 oy11 = mod(floor(p11*K), 7.0)*K - Ko;
        vec3 oz11 = floor(p11*K2)*Kz - Kzo;

        vec3 ox12 = fract(p12*K) - Ko;
        vec3 oy12 = mod(floor(p12*K), 7.0)*K - Ko;
        vec3 oz12 = floor(p12*K2)*Kz - Kzo;

        vec3 ox13 = fract(p13*K) - Ko;
        vec3 oy13 = mod(floor(p13*K), 7.0)*K - Ko;
        vec3 oz13 = floor(p13*K2)*Kz - Kzo;

        vec3 ox21 = fract(p21*K) - Ko;
        vec3 oy21 = mod(floor(p21*K), 7.0)*K - Ko;
        vec3 oz21 = floor(p21*K2)*Kz - Kzo;

        vec3 ox22 = fract(p22*K) - Ko;
        vec3 oy22 = mod(floor(p22*K), 7.0)*K - Ko;
        vec3 oz22 = floor(p22*K2)*Kz - Kzo;

        vec3 ox23 = fract(p23*K) - Ko;
        vec3 oy23 = mod(floor(p23*K), 7.0)*K - Ko;
        vec3 oz23 = floor(p23*K2)*Kz - Kzo;

        vec3 ox31 = fract(p31*K) - Ko;
        vec3 oy31 = mod(floor(p31*K), 7.0)*K - Ko;
        vec3 oz31 = floor(p31*K2)*Kz - Kzo;

        vec3 ox32 = fract(p32*K) - Ko;
        vec3 oy32 = mod(floor(p32*K), 7.0)*K - Ko;
        vec3 oz32 = floor(p32*K2)*Kz - Kzo;

        vec3 ox33 = fract(p33*K) - Ko;
        vec3 oy33 = mod(floor(p33*K), 7.0)*K - Ko;
        vec3 oz33 = floor(p33*K2)*Kz - Kzo;

        vec3 dx11 = Pfx + jitter*ox11;
        vec3 dy11 = Pfy.x + jitter*oy11;
        vec3 dz11 = Pfz.x + jitter*oz11;

        vec3 dx12 = Pfx + jitter*ox12;
        vec3 dy12 = Pfy.x + jitter*oy12;
        vec3 dz12 = Pfz.y + jitter*oz12;

        vec3 dx13 = Pfx + jitter*ox13;
        vec3 dy13 = Pfy.x + jitter*oy13;
        vec3 dz13 = Pfz.z + jitter*oz13;

        vec3 dx21 = Pfx + jitter*ox21;
        vec3 dy21 = Pfy.y + jitter*oy21;
        vec3 dz21 = Pfz.x + jitter*oz21;

        vec3 dx22 = Pfx + jitter*ox22;
        vec3 dy22 = Pfy.y + jitter*oy22;
        vec3 dz22 = Pfz.y + jitter*oz22;

        vec3 dx23 = Pfx + jitter*ox23;
        vec3 dy23 = Pfy.y + jitter*oy23;
        vec3 dz23 = Pfz.z + jitter*oz23;

        vec3 dx31 = Pfx + jitter*ox31;
        vec3 dy31 = Pfy.z + jitter*oy31;
        vec3 dz31 = Pfz.x + jitter*oz31;

        vec3 dx32 = Pfx + jitter*ox32;
        vec3 dy32 = Pfy.z + jitter*oy32;
        vec3 dz32 = Pfz.y + jitter*oz32;

        vec3 dx33 = Pfx + jitter*ox33;
        vec3 dy33 = Pfy.z + jitter*oy33;
        vec3 dz33 = Pfz.z + jitter*oz33;

        vec3 d11 = worely_dist(dx11, dy11, dz11, manhattanDistance);
        vec3 d12 = worely_dist(dx12, dy12, dz12, manhattanDistance);
        vec3 d13 = worely_dist(dx13, dy13, dz13, manhattanDistance);
        vec3 d21 = worely_dist(dx21, dy21, dz21, manhattanDistance);
        vec3 d22 = worely_dist(dx22, dy22, dz22, manhattanDistance);
        vec3 d23 = worely_dist(dx23, dy23, dz23, manhattanDistance);
        vec3 d31 = worely_dist(dx31, dy31, dz31, manhattanDistance);
        vec3 d32 = worely_dist(dx32, dy32, dz32, manhattanDistance);
        vec3 d33 = worely_dist(dx33, dy33, dz33, manhattanDistance);

        vec3 d1a = min(d11, d12);
        d12 = max(d11, d12);
        d11 = min(d1a, d13);
        d13 = max(d1a, d13);
        d12 = min(d12, d13);
        vec3 d2a = min(d21, d22);
        d22 = max(d21, d22);
        d21 = min(d2a, d23);
        d23 = max(d2a, d23);
        d22 = min(d22, d23);
        vec3 d3a = min(d31, d32);
        d32 = max(d31, d32);
        d31 = min(d3a, d33);
        d33 = max(d3a, d33);
        d32 = min(d32, d33);
        vec3 da = min(d11, d21);
        d21 = max(d11, d21);
        d11 = min(da, d31);
        d31 = max(da, d31);
        d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
        d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx;
        d12 = min(d12, d21);
        d12 = min(d12, d22);
        d12 = min(d12, d31);
        d12 = min(d12, d32);
        d11.yz = min(d11.yz,d12.xy);
        d11.y = min(d11.y,d12.z);
        d11.y = min(d11.y,d11.z);
        return sqrt(d11.xy);
    }

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

    vec4 grad4(float j, vec4 ip){
        const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
        vec4 p,s;

        p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
        p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
        s = vec4(lessThan(p, vec4(0.0)));
        p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

        return p;
    }

    float snoise(vec4 v){
        v += _R_SEED;

        const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                                0.309016994374947451); // (sqrt(5) - 1)/4   F4
        // First corner
        vec4 i  = floor(v + dot(v, C.yyyy) );
        vec4 x0 = v -   i + dot(i, C.xxxx);

        // Other corners

        // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
        vec4 i0;

        vec3 isX = step( x0.yzw, x0.xxx );
        vec3 isYZ = step( x0.zww, x0.yyz );
        //  i0.x = dot( isX, vec3( 1.0 ) );
        i0.x = isX.x + isX.y + isX.z;
        i0.yzw = 1.0 - isX;

        //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
        i0.y += isYZ.x + isYZ.y;
        i0.zw += 1.0 - isYZ.xy;

        i0.z += isYZ.z;
        i0.w += 1.0 - isYZ.z;

        // i0 now contains the unique values 0,1,2,3 in each channel
        vec4 i3 = clamp( i0, 0.0, 1.0 );
        vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
        vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

        //  x0 = x0 - 0.0 + 0.0 * C
        vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
        vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
        vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
        vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

        // Permutations
        i = mod(i, 289.0);
        float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
        vec4 j1 = permute( permute( permute( permute (
                    i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
                + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
                + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
                + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
        // Gradients
        // ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
        // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

        vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

        vec4 p0 = grad4(j0,   ip);
        vec4 p1 = grad4(j1.x, ip);
        vec4 p2 = grad4(j1.y, ip);
        vec4 p3 = grad4(j1.z, ip);
        vec4 p4 = grad4(j1.w, ip);

        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        p4 *= taylorInvSqrt(dot(p4,p4));

        // Mix contributions from the five corners
        vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
        vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
        m0 = m0 * m0;
        m1 = m1 * m1;
        return (49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
                    + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) )) * 0.5 + 0.5;

    }

    float snoise(vec3 v){
        v += _R_SEED.xyz;

        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        i = mod(i, 289.0 );
        vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return (42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) )) * 0.5 + 0.5;
    }

    // fnoise/fhash from: https://www.shadertoy.com/view/4sfGzS
    float fhash(vec3 p)  // replace this by something better
    {
        p  = fract( p*0.3183099+.1 );
        p *= 17.0;
        return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
    }
    
    float fnoise( in vec3 x )
    {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        
        return mix(mix(mix( fhash(i+vec3(0,0,0)), 
                            fhash(i+vec3(1,0,0)),f.x),
                       mix( fhash(i+vec3(0,1,0)), 
                            fhash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix( fhash(i+vec3(0,0,1)), 
                            fhash(i+vec3(1,0,1)),f.x),
                       mix( fhash(i+vec3(0,1,1)), 
                            fhash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    `;