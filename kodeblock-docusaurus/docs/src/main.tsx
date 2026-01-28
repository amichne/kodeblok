import { CodePane } from "kodeblok";
import "../../src/styles.css";
import { createRoot } from "react-dom/client";
import { demoSnippet } from "./demoSnippet";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

const root = createRoot(rootEl);

root.render(
  <div style={{ background: "#0f1115", minHeight: "100vh", padding: "32px" }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ color: "#e2e8f0", fontSize: "20px", marginBottom: "12px" }}>
        Kodeblok CodePane Demo
      </h1>
      <div style={{ height: "620px" }}>
        <CodePane snippet={demoSnippet} />
      </div>
    </div>
  </div>
);
