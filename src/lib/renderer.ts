import updateEntitiesShader from "./shaders/updateEntities.wgsl";
import spriteShader from "./shaders/sprite.wgsl";

export function createRenderPipeline(device: GPUDevice, presentationFormat: GPUTextureFormat) {
    return device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: spriteShader,
            }),
            buffers: [
                {
                    arrayStride: 0,
                    stepMode: "instance",
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x2",
                        },
                    ]
                },
                {
                    arrayStride: 4 * (4 + 1 + 1), // Two vec2<f32>, a f32 and padding
                    stepMode: "instance",
                    attributes: [
                        {
                            shaderLocation: 1,
                            offset: 0, // Pos of body
                            format: "float32x2",
                        },
                        // Only the position is wanted
                    ],
                },
                {
                    arrayStride: 4 * 3,
                    stepMode: "instance",
                    attributes: [
                        {
                            shaderLocation: 2,
                            offset: 0,
                            format: "float32x3",
                        },
                    ],
                },
                {
                    arrayStride: 2 * 4,
                    stepMode: "vertex",
                    attributes: [
                        {
                            shaderLocation: 3,
                            offset: 0,
                            format: "float32x2",
                        },
                    ],
                }
            ],
            entryPoint: "vert_main",
        },
        fragment: {
            module: device.createShaderModule({
                code: spriteShader,
            }),
            entryPoint: "frag_main",
            targets: [
                { format: presentationFormat },
            ],
        },
        primitive: {
            topology: "triangle-list",
        }
    });
}

export function createComputePipeline(device: GPUDevice) {
    return device.createComputePipeline({
        compute: {
            module: device.createShaderModule({
                code: updateEntitiesShader,
            }),
            entryPoint: "main",
        }
    });
}

export type SimulationParams = {
    deltaT: number,
    gravitationalConstant: number
};

export function createSimulationParamsBuffer(device: GPUDevice) {
    return device.createBuffer({
        size: 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
}

export function createRenderPassDesciptor(): GPURenderPassDescriptor {
    return {
        colorAttachments: [
            {
                view: undefined,
                loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                storeOp: "store",
            },
        ],
    };
}

export function updateSimulationParams(device: GPUDevice, buffer: GPUBuffer, params: SimulationParams) {
    device.queue.writeBuffer(
        buffer,
        0,
        new Float32Array([
            params.deltaT,
            params.gravitationalConstant,
        ]),
    );
}

export type EntityBindings = {
    buffers: GPUBuffer[],
    bindGroups: GPUBindGroup[],
};

export function createEntityBindings(
    device: GPUDevice,
    pipeline: GPUComputePipeline,
    paramsBuffer: GPUBuffer,
    initialData: Float32Array,
): EntityBindings {
    const entityBuffers: GPUBuffer[] = new Array(2);
    const entityBindGroups: GPUBindGroup[] = new Array(2);

    for (let i = 0; i < 2; i++) {
        entityBuffers[i] = device.createBuffer({
            size: initialData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        new Float32Array(entityBuffers[i].getMappedRange()).set(
            initialData
        );
        entityBuffers[i].unmap();
    }

    for (let i = 0; i < 2; i++) {
        entityBindGroups[i] = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: paramsBuffer,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: entityBuffers[i],
                        offset: 0,
                        size: initialData.byteLength,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: entityBuffers[(i + 1) % 2],
                        offset: 0,
                        size: initialData.byteLength,
                    }
                }
            ],
        });
    }

    return {
        buffers: entityBuffers,
        bindGroups: entityBindGroups,
    };
}

// Create inner scope to reduce global variables
const spriteVerticies = (function() {
    const verticies: number[] = [];
    const outerVertexCount = 16;
    const spriteRadius = 0.005;
    const increment = 2 * Math.PI / outerVertexCount;
    for (let a = 0; a < 2 * Math.PI; a += increment) {
        verticies.push(
            0, 0,
            Math.cos(a) * spriteRadius, Math.sin(a) * spriteRadius,
            Math.cos(a + increment) * spriteRadius, Math.sin(a + increment) * spriteRadius,
        );
    }
    return verticies;
})();

export function createScaleVertexBuffer(
    device: GPUDevice,
    scaleX: number,
    scaleY: number,
) {
    const buffer = device.createBuffer({
        size: 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set([ scaleX, scaleY ]);
    buffer.unmap();
    return buffer;
}

export function createSpriteVertexBuffer(device: GPUDevice, aspectRatio: number) {
    const verticies: number[] = [];

    for (let i = 0; i < spriteVerticies.length; i ++) {
        verticies.push(spriteVerticies[i] * (i % 2 == 0 ? aspectRatio : 1));
    }

    const verticiesArray = new Float32Array(verticies);

    const buffer = device.createBuffer({
        size: verticiesArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(verticiesArray);
    buffer.unmap();
    return buffer;
}

export function createSpriteColourBuffer(device: GPUDevice, initialData: Float32Array) {
    const buffer = device.createBuffer({
        size: initialData.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(initialData);
    buffer.unmap();
    return buffer;
}

export function frameRender(
    device: GPUDevice,
    context: GPUCanvasContext,
    renderPipeline: GPURenderPipeline,
    computePipeline: GPUComputePipeline,
    renderPassDescriptor: GPURenderPassDescriptor,
    entityBindings: EntityBindings,
    entityCount: number,
    renderScaleBuffer: GPUBuffer,
    spriteVertexBuffer: GPUBuffer,
    spriteColourBuffer: GPUBuffer,
) {
    const entityBuffers = entityBindings.buffers;
    const entityBindGroups = entityBindings.bindGroups;
    const computeDispatch = Math.ceil(entityCount / 64);

    // For alternating buffers
    let t = 0;

    // The function to be called every frame
    const frame = () => {
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

        const commandEncoder = device.createCommandEncoder();
        {
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, entityBindGroups[t % 2]);
            passEncoder.dispatch(computeDispatch);
            passEncoder.endPass();
        }
        {
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setPipeline(renderPipeline);
            passEncoder.setVertexBuffer(0, renderScaleBuffer);
            passEncoder.setVertexBuffer(1, entityBuffers[(t + 1) % 2]);
            passEncoder.setVertexBuffer(2, spriteColourBuffer);
            passEncoder.setVertexBuffer(3, spriteVertexBuffer);
            passEncoder.draw(spriteVerticies.length / 2, entityCount, 0, 0);
            passEncoder.endPass();
        }

        device.queue.submit([commandEncoder.finish()]);

        // Swap buffers
        t++;
        requestAnimationFrame(frame);
    }
    return frame
}

