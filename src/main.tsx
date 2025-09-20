import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

console.log("main.tsx está sendo executado!"); // Adicionado para depuração

createRoot(document.getElementById("root")!).render(<App />);