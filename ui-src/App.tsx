import { useCallback, useEffect, useState } from "react";
import "./App.css";

interface TextListMessage {
  type: "text-list";
  texts: string[];
}

const MARKDOWN_HEADER = "| 日本語 | 英語 | メモ |";
const MARKDOWN_SEPARATOR = "|--------|------|------|";

function generateMarkdownTable(texts: string[]): string {
  const rows = texts.map((text) => `| ${text} |  |  |`);
  return [MARKDOWN_HEADER, MARKDOWN_SEPARATOR, ...rows].join("\n");
}

function App() {
  const [texts, setTexts] = useState<string[]>([]);
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const checkedCount = checkedIndices.size;
  const allChecked = texts.length > 0 && checkedCount === texts.length;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as TextListMessage | undefined;
      if (msg?.type === "text-list") {
        setTexts(msg.texts);
        setCheckedIndices(new Set());
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setCopied(false);
    parent.postMessage({ pluginMessage: { type: "refresh" } }, "*");
  };

  const handleClose = () => {
    parent.postMessage({ pluginMessage: { type: "close" } }, "*");
  };

  const handleToggleItem = useCallback((index: number) => {
    setCheckedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (allChecked) {
      setCheckedIndices(new Set());
    } else {
      setCheckedIndices(new Set(texts.map((_, i) => i)));
    }
  }, [allChecked, texts]);

  const handleOk = useCallback(async () => {
    const selectedTexts = texts.filter((_, i) => checkedIndices.has(i));
    const markdown = generateMarkdownTable(selectedTexts);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is not available
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [texts, checkedIndices]);

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
        {loading ? (
          "Loading..."
        ) : (
          <label className="toggle-all">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              disabled={texts.length === 0}
            />
            <span>
              {texts.length} text nodes found
              {checkedCount > 0 && ` (${checkedCount} selected)`}
            </span>
          </label>
        )}
      </div>

      <main className="list">
        {!loading && texts.length === 0 && (
          <p className="empty">No text nodes found on this page.</p>
        )}
        {texts.map((text, index) => (
          <label key={index} className="list-item checkbox-item">
            <input
              type="checkbox"
              checked={checkedIndices.has(index)}
              onChange={() => handleToggleItem(index)}
            />
            <span className="item-text">{text}</span>
          </label>
        ))}
      </main>

      {checkedCount > 0 && (
        <footer className="footer">
          {copied && <span className="copied-feedback">Copied!</span>}
          <button className="btn btn-ok" onClick={handleOk}>
            OK ({checkedCount} selected)
          </button>
        </footer>
      )}
    </div>
  );
}

export default App;
