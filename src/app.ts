import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";

class App {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.WebGPUEngine = null!;
    private scene: BABYLON.Scene = null!;

    constructor() {
        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);
    }

    async initialize() {
        // check if the browser supports WebGPU
        if (await BABYLON.WebGPUEngine.IsSupportedAsync == false) {
            alert("WebGPU is not supported in this browser. Please use a compatible browser.");
            return;
        }

        // initialize babylon scene and engine
        this.engine = new BABYLON.WebGPUEngine(this.canvas);
        await this.engine.initAsync();
        this.scene = new BABYLON.Scene(this.engine);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        // populate the scene
        await this.populateScene();

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    async populateScene() {
        // camera
        var camera = new BABYLON.ArcRotateCamera("camera", Math.PI * 0.15, Math.PI * 0.35, 5, new BABYLON.Vector3(0,1,0), this.scene);
        camera.attachControl(this.canvas, true);
        camera.minZ = 0.01;
        camera.maxZ = 20;
        camera.zoomOnFactor = 0.5;
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 8;
        
        // skybox
        const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData("./environment/brown_photostudio_02_4k.env", this.scene); // [source: https://polyhaven.com/a/brown_photostudio_02], converted from hdr to env using https://www.babylonjs.com/tools/ibl/
        this.scene.environmentTexture = envTex;
        this.scene.environmentIntensity = 1;
        const skybox = this.scene.createDefaultSkybox(envTex, true);

        // sphere
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, this.scene);
        const sphereMaterial = new BABYLON.PBRMaterial("sphereMaterial", this.scene);
        sphere.position = new BABYLON.Vector3(0, 2, 0);
        sphereMaterial.roughness = 0;
        sphere.material = sphereMaterial;

        // ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 15, height: 15 }, this.scene);;
        const groundMaterial = new BABYLON.PBRMaterial("groundMaterial", this.scene);
        groundMaterial.roughness = 0.1;
        ground.material = groundMaterial;

        // table
        const tableImportResult = await BABYLON.ImportMeshAsync("./models/side_table_tall_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/side_table_tall_01], convert to glb using blender.
        const table = tableImportResult.meshes[1] as BABYLON.Mesh;
        table.position = new BABYLON.Vector3(0, 0, 0);

        // chair
        const chairImportResult = await BABYLON.ImportMeshAsync("./models/arm_chair_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/ArmChair_01], convert to glb using blender.
        const chair = chairImportResult.meshes[1] as BABYLON.Mesh;
        chair.position = new BABYLON.Vector3(0, 0, -1);

        // shelf
        const shelfImportResult = await BABYLON.ImportMeshAsync("./models/steel_frame_shelves_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/steel_frame_shelves_01], convert to glb using blender.
        const shelf = shelfImportResult.meshes[1] as BABYLON.Mesh;
        shelf.position = new BABYLON.Vector3(1, 0, 0);
        shelf.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
    }
}

const app = new App();
app.initialize();