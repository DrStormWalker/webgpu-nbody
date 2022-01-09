struct VertexOut {
    [[builtin(position)]] position : vec4<f32>;
    [[location(0)]] colour : vec4<f32>;
};

[[stage(vertex)]]
fn vert_main(
    [[location(0)]] scale : vec2<f32>,
    [[location(1)]] particle_pos : vec2<f32>,
    [[location(2)]] particle_colour : vec3<f32>,
    [[location(3)]] pos : vec2<f32>,
) -> VertexOut {
    var out : VertexOut;
    out.position = vec4<f32>(particle_pos * scale + pos, 0.0, 1.0);
    out.colour = vec4<f32>(particle_colour, 1.0);
    return out;
}

[[stage(fragment)]]
fn frag_main([[location(0)]] colour : vec4<f32>) -> [[location(0)]] vec4<f32> {
    return colour;
}
