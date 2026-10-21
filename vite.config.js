import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Saat `npm run dev`, /api dan /uploads diteruskan ke backend (npm run server, port 3001).
const api = `http://localhost:${process.env.PORT || 3001}`;
export default defineConfig({ plugins: [react()], server: { proxy: { "/api": api, "/uploads": api, "/admin": api } } });
