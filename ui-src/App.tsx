import { useEffect, useState } from "react";
import "./App.css";

interface TextListMessage {
  type: "text-list";
  texts: string[];
}

function App() {
  const [texts, setTexts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as TextListMessage | undefined;
      if (msg?.type === "text-list") {
        setTexts(msg.texts);
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    parent.postMessage({ pluginMessage: { type: "refresh" } }, "*");
  };

  const handleClose = () => {
    parent.postMessage({ pluginMessage: { type: "close" } }, "*");
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Extract Words</h1>
        <div className="actions">
          <button className="btn" onClick={handleRefresh} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-close" onClick={handleClose}>
            Close
          </button>
        </div>
      </header>

      <div className="count">
        {loading ? "Loading..." : `${texts.length} text nodes found`}
      </div>

      <main className="list">
        {!loading && texts.length === 0 && (
          <p className="empty">No text nodes found on this page.</p>
        )}
        {texts.map((text, index) => (
          <div key={index} className="list-item">
            {text}
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
