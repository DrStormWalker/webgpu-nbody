<script lang="ts">
    import _ from "./App.css";
    import Entity from "./lib/Entity";
    import {
        createComputePipeline,
        createEntityBindings,
        createRenderPassDesciptor,
        createRenderPipeline,
        createScaleVertexBuffer,
        createSimulationParamsBuffer,
        createSpriteColourBuffer,
        createSpriteVertexBuffer,
        frameRender,
        SimulationParams,
        updateSimulationParams
    } from "./lib/renderer";

    async function init() {
        const canvas = document.querySelector("#mainCanvas") as HTMLCanvasElement;
        if (!("gpu" in navigator)) {
            alert("Unable to initialize WebGPU. Please make sure it is supported by your browser and it is enabled.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();

        const context = canvas.getContext("webgpu");

        if (context === null) {
            alert("Unable to initialize WebGPU. Please make sure it is supported by your browser and it is enabled.");
            return;
        }

        const aspectRatio = canvas.height / canvas.width
        const devicePixelRatio = window.devicePixelRatio || 1;
        const presentationSize = [
            canvas.clientWidth * devicePixelRatio,
            canvas.clientHeight * devicePixelRatio,
        ];
        const presentationFormat = context.getPreferredFormat(adapter);

        context.configure({
            device,
            format: presentationFormat,
            size: presentationSize,
        });

        const simulationParams: SimulationParams = {
            deltaT: 86400 * 6,
            gravitationalConstant: 6.67e-11,
        };

        const white = { r: 1, g: 1, b: 1 };

        const orbitalEntities: Entity[] = [
            //         x          y  vx vy       mass
            new Entity(0.0,0.0,        0.0,0.0,        1.989e30), // a star similar to the sun
            new Entity(57.909e9,0.0,   0.0,47.36e3,    0.33011e24), // a planet similar to mercury
            new Entity(108.209e9,0.0,  0.0,35.02e3,    4.8675e24), // a planet similar to venus
            new Entity(149.596e9,0.0,  0.0,29.78e3,    5.9724e24), // a planet similar to earth
            new Entity(227.923e9,0.0,  0.0,24.07e3,    0.64171e24), // a planet similar to mars
            new Entity(778.570e9,0.0,  0.0,13e3,       1898.19e24), // a planet similar to jupiter
            new Entity(1433.529e9,0.0, 0.0,9.68e3,     568.34e24), // a planet similar to saturn
            new Entity(2872.463e9,0.0, 0.0,6.80e3,     86.813e24), // a planet similar to uranus
            new Entity(4495.060e9,0.0, 0.0,5.43e3,     102.413e24), // a planet similar to neptune
        ];
        const [ entityParticleBuffer, spriteColours ] = Entity.encodeArrays(orbitalEntities);

        const renderPipeline = createRenderPipeline(device, presentationFormat);
        const computePipeline = createComputePipeline(device);

        const renderPassDescriptor = createRenderPassDesciptor();

        const simulationParamsBuffer = createSimulationParamsBuffer(device);
        updateSimulationParams(device, simulationParamsBuffer, simulationParams);

        const entityBindings = createEntityBindings(
            device,
            computePipeline,
            simulationParamsBuffer,
            entityParticleBuffer,
        );

        console.log(aspectRatio);

        const renderScaleBuffer = createScaleVertexBuffer(device, 0.25e-12 * aspectRatio, 0.25e-12);
        const spriteVertexBuffer = createSpriteVertexBuffer(device, aspectRatio);
        const spriteColourBuffer = createSpriteColourBuffer(device, spriteColours);

        let frame = frameRender(
            device,
            context,
            renderPipeline,
            computePipeline,
            renderPassDescriptor,
            entityBindings,
            orbitalEntities.length,
            renderScaleBuffer,
            spriteVertexBuffer,
            spriteColourBuffer,
        );

        requestAnimationFrame(frame);
    }

    window.onload = init;
</script>

<style>
    body {
        margin: 0;
        padding: 0;
    }
</style>

<canvas id="mainCanvas" width={window.innerWidth} height={window.innerHeight}></canvas>

