window.SDF_SHADERS = `
    #define PI 3.14159265359
    #define E_CONST 2.71828182845904523536

    float smoothQuantize(float A, float p) {
        float a = clamp(A, 0., 1.) * 2. - 1.;
        if (a >= 0.) {
            return 0.5 + pow(a, 1./p) * 0.5;
        }
        else {
            return 0.5 - pow(-a, 1./p) * 0.5;
        }
    }

    float rand(vec2 co) {
        return fract(sin(dot(co.xy + _R_SEED.xy, vec2(12.9898,78.233))) * 43758.5453);
    }
    float rand(vec3 co) {
        return rand(vec2(co.x, rand(co.yz) * 43758.5453));
    }
    float rand(float co) {
        return rand(vec2(co));
    }

    float sdSphere( vec3 p, float s ) {
        return length(p)-s;
    }

    float sdDiamond( vec3 p, float s ) {
        return (abs(p.x) + abs(p.y) + abs(p.z)) - s;
    }

    float sdBox( vec3 p, vec3 b ) {
        vec3 d = abs(p) - b;
        return length(max(d, 0.0));
                + min(max(d.x, max(d.y, d.z)), 0.0); // remove this line for an only partially signed sdf
    }

    float sdBoxSigned (vec3 p, vec3 c, vec3 s)
    {
        float x = max(
            p.x - c.x - s.x * 0.5,
            c.x - p.x - s.x * 0.5
        );

        float y = max(
            p.y - c.y - s.y * 0.5,
            c.y - p.y - s.y * 0.5
        );

        float z = max(
            p.z - c.z - s.z * 0.5,
            c.z - p.z - s.z * 0.5
        );

        float d = x;
        d = max(d, y);
        d = max(d, z);
        return d;
    }

    float sdBoxSignedWP (vec3 p, vec3 c, vec3 s) {
        float ret = sdBoxSigned(p, c, s);
        ret = min(ret, length(p - (c + vec3(-s.x, -s.y, -s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(s.x, -s.y, -s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(-s.x, s.y, -s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(s.x, s.y, -s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(-s.x, -s.y, s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(s.x, -s.y, s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(-s.x, s.y, s.z) * 0.5)));
        ret = min(ret, length(p - (c + vec3(s.x, s.y, s.z) * 0.5)));
        return ret;
    }

    float sdTorus( vec3 p, vec2 t ) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
    }

    float sdCappedTorus(vec3 p, vec2 sc, float ra, float rb) {
        p.x = abs(p.x);
        float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);
        return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
    }

    float sdCylinder( vec3 p, vec3 c ) {
        return length(p.xz - c.xy) - c.z;
    }

    float sdCappedCylinder(vec3 p, vec3 a, vec3 b, float r) {
        vec3  ba = b - a;
        vec3  pa = p - a;
        float baba = dot(ba,ba);
        float paba = dot(pa,ba);
        float x = length(pa*baba-ba*paba) - r*baba;
        float y = abs(paba-baba*0.5)-baba*0.5;
        float x2 = x*x;
        float y2 = y*y*baba;
        float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));
        return sign(d)*sqrt(abs(d))/baba;
    }

    float sdCone( vec3 p, vec2 c ) {
        float q = length(p.xy);
        return dot(c, vec2(q, p.z));
    }

    vec2 rotate2D( vec2 p, float a ) {
        float c = cos(a);
        float s = sin(a);
        mat2 m = mat2(c,-s,s,c);
        return m * p;
    }

    float sdDiamond( vec3 p, float s, vec3 skew ) {
        vec2 pxy = rotate2D(p.xy, PI * 0.25);
        pxy /= skew.xy;
        pxy = rotate2D(pxy, -PI * 0.25);
        return (abs(pxy.x) + abs(pxy.y) + abs(p.z/skew.z)) - s;
    }

    vec3 opTwistZ( vec3 p, float k ) {
        float c = cos(k*p.z);
        float s = sin(k*p.z);
        mat2  m = mat2(c,-s,s,c);
        return vec3(m*p.xy,p.z);
    }

    vec3 opTwistX( vec3 p, float k ) {
        float c = cos(k*p.x);
        float s = sin(k*p.x);
        mat2  m = mat2(c,-s,s,c);
        vec2 r = m*p.yz;
        return vec3(p.x, r.x, r.y);
    }

    vec3 opTwistY( vec3 p, float k ) {
        float c = cos(k*p.y);
        float s = sin(k*p.y);
        mat2  m = mat2(c,-s,s,c);
        vec2 r = m*p.xz;
        return vec3(r.x, p.y, r.y);
    }

    float opSmoothMin( float d1, float d2, float k ) {
        return -log(exp(-k*d1)+exp(-k*d2))/k;
    }

    float opRound( float d, float rad ) {
        return d - rad;
    }

    float opSmoothUnion( float d1, float d2, float k ) {
        float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
        return mix( d2, d1, h ) - k*h*(1.0-h);
    }

    float opSmoothSubtraction( float d2, float d1, float k ) {
        float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
        return mix( d2, -d1, h ) + k*h*(1.0-h);
    }

    float opSmoothIntersection( float d1, float d2, float k ) {
        float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
        return mix( d2, d1, h ) + k*h*(1.0-h);
    }

    float opSmoothLimit( float d2, float d1, float k ) {
        float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
        return mix( d2, d1, h ) + k*h*(1.0-h);
    }

    float opUnion( float d1, float d2 ) { return min(d1,d2); }

    float opSubtraction( float d1, float d2 ) { return max(-d2, d1); }

    float opIntersection( float d1, float d2 ) { return max(d1,d2); }

    float opLimit( float d1, float d2 ) {
        return max(d2, d1);
    }
`