import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./config/hmr-fix.js";

createRoot(document.getElementById("root")!).render(<App />);
