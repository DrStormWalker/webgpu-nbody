[[block]] struct SimulationParams {
    delta_t : f32;
    gravitational_constant : f32;
};

struct Particle {
    pos : vec2<f32>;
    vel : vec2<f32>;
    mass : f32;
};
[[block]] struct Particles {
    particles : [[stride(24)]] array<Particle>;  
};

[[binding(0), group(0)]] var<uniform> params : SimulationParams;

// Use two buffers to avoid interferance from the results already calculated
[[binding(1), group(0)]] var<storage, read> particles_r : Particles;
[[binding(2), group(0)]] var<storage, read_write> particles_w : Particles;

[[stage(compute), workgroup_size(64)]]
fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
    var index : u32 = GlobalInvocationID.x;
    if (index >= arrayLength(&particles_r.particles)) {
        return;
    }

    var pos = particles_r.particles[index].pos;
    var vel = particles_r.particles[index].vel;
    var mass = particles_r.particles[index].mass;

    // I'm using a maths/physics variable notation here to make the equations look cleaner
    // Reference:
    //  G  -> gravtitational constant
    //  Sa -> sum of accelerations, taken from maths notation of Σ (upper case sigma) meaning sum of
    //  s  -> displacement
    //  d  -> distance
    //  sc -> normalised displacement, taken from maths notation of ^ (carrot) meaning normalised
    //  a  -> acceleration (scalar)

    var G = params.gravitational_constant;
    var p : Particle;

    var s : vec2<f32>;
    var d : f32;
    var Sa : vec2<f32> = vec2<f32>(0.0, 0.0);
    var sc : vec2<f32>;
    var a : f32;

    for (var i : u32 = 0u; i < arrayLength(&particles_r.particles); i = i + 1u) {
        if (i == index) { continue; }

        p = particles_r.particles[i];
        s = pos - p.pos;

        d = sqrt(s.x*s.x + s.y*s.y);
        sc = s / d;

        a = -1.0 * G * p.mass / (d*d);

        Sa = Sa + a * sc;
    }

    particles_w.particles[index].vel = vel + Sa * params.delta_t;

    particles_w.particles[index].pos = pos + particles_w.particles[index].vel * params.delta_t;
}

