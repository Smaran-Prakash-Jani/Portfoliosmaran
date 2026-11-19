
  import { createRoot } from "react-dom/client";
  import { qualityTier } from "./app/lib/quality";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // the device's quality tier, also available to CSS as html[data-quality]
  document.documentElement.dataset.quality = qualityTier();
  createRoot(document.getElementById("root")!).render(<App />);
  