import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";

// Handles morphing of meshes using a compute shader
export class MorphPipeline {
    private computeShader: BABYLON.ComputeShader;
    private paramsBuffer: BABYLON.UniformBuffer;
    private time: number = 0;

    constructor(private engine: BABYLON.WebGPUEngine) {
        // Compute shader code WGSL
        const shaderCode = `
struct Params {
    scale: vec3<f32>
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> vertexData : array<f32>;
@group(0) @binding(2) var<storage, read_write> vertexBuffer : array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) grid: vec3u) {
    // Global index of the vertex
    let vertexIndex = grid.x;
 
    // Check if index is out of bounds
    if (vertexIndex * 3 >= arrayLength(&vertexData)) {
        return;
    }

    // Assemble the vertex data from the array
    var vertex = vec3<f32>(vertexData[vertexIndex * 3 + 0], vertexData[vertexIndex * 3 + 1], vertexData[vertexIndex * 3 + 2]);

    // Manipulate scale
    vertex = vertex * params.scale;

    // Output result to the vertex buffer
    vertexBuffer[vertexIndex * 3 + 0] = vertex.x;
    vertexBuffer[vertexIndex * 3 + 1] = vertex.y;
    vertexBuffer[vertexIndex * 3 + 2] = vertex.z;
}
        `;

        // Create compute shader and binds buffers
        this.computeShader = new BABYLON.ComputeShader(
            "morphshader",
            this.engine,
            { computeSource: shaderCode },
            {
                bindingsMapping:
                {
                    "params": { group: 0, binding: 0 },
                    "vertexData": { group: 0, binding: 1 },
                    "vertexBuffer": { group: 0, binding: 2 },
                }
            }
        );

        // Create and bind the params buffer
        this.paramsBuffer = new BABYLON.UniformBuffer(this.engine);
        this.paramsBuffer.addFloat3("scale", 1, 1, 1);
        this.computeShader.setUniformBuffer("params", this.paramsBuffer);
    }

    update(morphTargets: Array<MorphTarget>): void {

        this.time += this.engine.getDeltaTime() / 1000;

        morphTargets.forEach(morphTarget => {

            // Bind buffers
            this.computeShader.setStorageBuffer("vertexData", morphTarget.vertexDataBuffer);
            this.computeShader.setStorageBuffer("vertexBuffer", morphTarget.vertexBuffer.getBuffer() as BABYLON.DataBuffer);

            // Calculate and update scale based on params
            const t = morphTarget.params.animate ? (Math.sin(this.time * 2 * Math.PI) + 1) * 0.5 : 1;
            const scale = BABYLON.Vector3.Lerp(BABYLON.Vector3.One(), morphTarget.params.scale, t);
            this.paramsBuffer.updateFloat3("scale", scale.x, scale.y, scale.z);
            this.paramsBuffer.update();

            // Dispatch the compute shader
            const groupCount = Math.ceil(morphTarget.vertexCount / 64);
            this.computeShader.dispatchWhenReady(groupCount);
        });
    }
}

export class MorphTarget {

    public params: MorphTargetParams = {
        animate: true,
        scale: new BABYLON.Vector3(1, 1, 1),
    };

    public vertexCount: number;
    public vertexDataByteLength: number;
    public vertexDataBuffer: BABYLON.StorageBuffer;
    public vertexBuffer: BABYLON.VertexBuffer;

    constructor(private engine: BABYLON.WebGPUEngine, public mesh: BABYLON.Mesh) {
        const vertexData = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind, false, true) as Float32Array; // Fetch vertex data from the mesh
        this.vertexCount = vertexData.length / 3; // Number of vertices (3 floats per vertex)
        this.vertexDataByteLength = this.vertexCount * 3 * 4; // 3 floats per vertex, 4 bytes per float

        // Create a storage buffer for the original vertex data
        this.vertexDataBuffer = new BABYLON.StorageBuffer(this.engine, this.vertexDataByteLength, BABYLON.Constants.BUFFER_CREATIONFLAG_STORAGE | BABYLON.Constants.BUFFER_CREATIONFLAG_WRITE, "vertexDataBuffer");
        this.vertexDataBuffer.update(vertexData, 0, this.vertexDataByteLength);

        // Create a new vertex buffer for the mesh that can be both bound to the compute shader and used as a vertex buffer for rendering
        const storageBuffer = new BABYLON.StorageBuffer(this.engine, this.vertexDataByteLength, BABYLON.Constants.BUFFER_CREATIONFLAG_STORAGE | BABYLON.Constants.BUFFER_CREATIONFLAG_VERTEX, "vertexBuffer");
        this.vertexBuffer = new BABYLON.VertexBuffer(this.engine, storageBuffer.getBuffer(), BABYLON.VertexBuffer.PositionKind); // Link the storage buffer to the vertex buffer
        mesh.setVerticesBuffer(this.vertexBuffer, true); // Discard previous vertex buffer and set the new with correct flags. 
    }
}

interface MorphTargetParams {
    animate: boolean;
    scale: BABYLON.Vector3;
}
