import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import * as BABYLON from "@babylonjs/core";
import { MorphPipeline, MorphTarget } from "./MorphPipeline";
import * as dat from "dat.gui";

class App {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.WebGPUEngine = null!;
    private scene: BABYLON.Scene = null!;

    private objects: BABYLON.Mesh[] = [];

    private morphPipeline: MorphPipeline = null!;
    private morphTargets: Array<MorphTarget> = [];

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
        await this.populateSceneAsync();

        // create morph pipeline to the scene
        this.createMorphPipeline();

        // enable the morph targets to be picked and their values changed through a GUI
        this.createMorphTargetPicker();

        // update the morph targets "default" values.
        this.morphTargets.find(morphTarget => morphTarget.mesh.name === "table")?.params.scale.set(1, 1.25, 1);
        this.morphTargets.find(morphTarget => morphTarget.mesh.name === "chair")?.params.scale.set(3.5, 1, 1);

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.morphPipeline.update(this.morphTargets);
        });
    }

    async populateSceneAsync() {
        // camera
        var camera = new BABYLON.ArcRotateCamera("camera", Math.PI * 0.15, Math.PI * 0.35, 5, new BABYLON.Vector3(0, 1, 0), this.scene);
        camera.attachControl(this.canvas, true);
        camera.minZ = 0.01;
        camera.zoomOnFactor = 0.5;
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 8;

        // skybox
        const environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./environment/brown_photostudio_02_4k.env", this.scene); // [source: https://polyhaven.com/a/brown_photostudio_02], converted from hdr to env using https://www.babylonjs.com/tools/ibl/
        this.scene.environmentTexture = environmentTexture;
        this.scene.environmentIntensity = 1;
        this.scene.createDefaultSkybox(environmentTexture, true);

        // add objects to scene
        await this.addObjectsAsync();

        // add some nice lighting to the scene
        this.addLights();
    }

    async addObjectsAsync() {
        // sphere
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.5 }, this.scene);
        const sphereMaterial = new BABYLON.PBRMaterial("sphereMaterial", this.scene);
        sphere.position = new BABYLON.Vector3(0, 2, 0);
        sphereMaterial.roughness = 0.1;
        sphere.material = sphereMaterial;
        this.objects.push(sphere);

        // ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 15, height: 15 }, this.scene);;
        const groundMaterial = new BABYLON.PBRMaterial("groundMaterial", this.scene);
        groundMaterial.roughness = 0.1;
        ground.material = groundMaterial;
        this.objects.push(ground);

        // table
        const tableImportResult = await BABYLON.ImportMeshAsync("./models/side_table_tall_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/side_table_tall_01], convert to glb using blender.
        const table = tableImportResult.meshes[1] as BABYLON.Mesh;
        table.name = "table";
        table.position = new BABYLON.Vector3(0, 0, 0);
        this.objects.push(table);

        // chair
        const chairImportResult = await BABYLON.ImportMeshAsync("./models/arm_chair_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/ArmChair_01], convert to glb using blender.
        const chair = chairImportResult.meshes[1] as BABYLON.Mesh;
        chair.name = "chair";
        chair.position = new BABYLON.Vector3(0, 0, -1);
        this.objects.push(chair);

        // shelf
        const shelfImportResult = await BABYLON.ImportMeshAsync("./models/steel_frame_shelves_01_1k.glb", this.scene); //  [source: https://polyhaven.com/a/steel_frame_shelves_01], convert to glb using blender.
        const shelf = shelfImportResult.meshes[1] as BABYLON.Mesh;
        shelf.name = "shelf";
        shelf.position = new BABYLON.Vector3(1, 0, 0);
        shelf.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        this.objects.push(shelf);
    }

    addLights() {
        // red light
        const light1 = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(-1, -1, 1), this.scene);
        light1.position = new BABYLON.Vector3(0, 10, 0);
        light1.diffuse = new BABYLON.Color3(1, 0, 0);
        const shadowGenerator1 = new BABYLON.ShadowGenerator(1024, light1);

        // green light
        const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(1, -1, 1), this.scene);
        light2.position = new BABYLON.Vector3(0, 10, 0);
        light2.diffuse = new BABYLON.Color3(0, 1, 0);
        const shadowGenerator2 = new BABYLON.ShadowGenerator(1024, light2);
        
        // blue light
        const light3 = new BABYLON.DirectionalLight("light3", new BABYLON.Vector3(1, -1, -1), this.scene);
        light3.position = new BABYLON.Vector3(0, 10, 0);
        light3.diffuse = new BABYLON.Color3(0, 0, 1);
        const shadowGenerator3 = new BABYLON.ShadowGenerator(1024, light3);

        // enable shadows for all objects
        this.objects.forEach(object => {
            object.receiveShadows = true;
            shadowGenerator1.addShadowCaster(object, true);
            shadowGenerator2.addShadowCaster(object, true);
            shadowGenerator3.addShadowCaster(object, true);
        });
    }

    createMorphPipeline() {
        this.morphPipeline = new MorphPipeline(this.engine);

        // create morph target for each object
        this.objects.forEach(object => {
            const morphTarget = new MorphTarget(this.engine, object);
            this.morphTargets.push(morphTarget);
        });
    }

    createMorphTargetPicker() {
        var picker = new BABYLON.GPUPicker();
        picker.setPickingList(this.morphTargets.map(morphTarget => morphTarget.mesh));

        var gui: BABYLON.Nullable<dat.GUI> = null;
        this.scene.skipPointerDownPicking = true; // Disable default cpu picking.
        this.scene.onPointerDown = (evt) => {
            if (picker.pickingInProgress || evt.button !== 0) return;

            picker.pickAsync(this.scene.pointerX, this.scene.pointerY).then((pickingInfo) => {
                if (pickingInfo == null) return;

                if (gui != null) {
                    gui.destroy();
                }

                const morphTarget = this.morphTargets.find(morphTarget => morphTarget.mesh === pickingInfo.mesh);
                if (morphTarget == null) return;

                gui = new dat.GUI();
                gui.domElement.id = "datGUI";

                // add a lable for the current mesh
                gui.add({ mesh: morphTarget.mesh.name }, "mesh").name("Current Mesh").listen();
                gui.add(morphTarget.params.scale, "x", 1, 5).name('scale X');
                gui.add(morphTarget.params.scale, "y", 1, 5).name('scale Y');
                gui.add(morphTarget.params.scale, "z", 1, 5).name('scale Z');
                gui.add(morphTarget.params, "animate").name('animate');
            });
        }
    }
}

const app = new App();
app.initialize();