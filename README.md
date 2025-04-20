# 🪑 IKEA – 3D Web Demo

This is a **3D web demo** created as part of the application process for the **IKEA IPEX 3D Developer** position.

The demo is built using modern web tools:

- 🎮 **[Babylon.js](https://www.babylonjs.com/)** – A powerful 3D engine for the web  
- ⚡ **[Vite](https://vitejs.dev/)** – A fast frontend build tool  
- 🧑‍💻 **TypeScript** – For type-safe JavaScript development

## ✅ Prerequisites

Make sure you have the following installed before running the project:

- [Node.js](https://nodejs.org/) – Version **22.x** recommended  
- [npm](https://www.npmjs.com/) – Comes bundled with Node.js

## 🚀 Getting Started

1. **Clone the repository** (if you haven’t already):

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The app will be available at [http://localhost:5173](http://localhost:5173) (or another port if 5173 is occupied).

## 📁 Project Structure

- `src/` – Main source code including the Babylon.js scene setup  
- `public/` – Static assets like textures, models, and environment  
- `vite.config.ts` – Vite configuration  

## ✨ Features

- 🔧 Built using **Babylon.js v8.x** and the **WebGPU Engine** for compute shader support
- 🗂️ Models are loaded from **.glb** files, complete with **textures** and **PBR material** setups  
- 🌅 The scene features an **environment skybox** and multiple **shadow-casting lights**  
- 🧬 A **compute shader** is used to **morph mesh vertices** dynamically in the scene  
- 🎯 **GPU-based picking** allows selection of objects directly in the 3D view  
- 🎛️ Selected objects can be manipulated using an intuitive **GUI** (built with `dat.gui`) to control morph parameters

## 🛠️ Notes

- Developed using **Node.js v22**, but versions after **v18** seem to work as well (untested).
