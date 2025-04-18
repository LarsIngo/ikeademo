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

        // populate the scene
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this.scene);
        camera.attachControl(this.canvas, true);
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this.scene);
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this.scene);

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

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

const app = new App();
app.initialize();