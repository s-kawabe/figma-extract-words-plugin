import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

interface TextNodeInfo {
  id: string;
  text: string;
}

interface TextListMessage {
  type: "text-list";
  texts: TextNodeInfo[];
}

interface SelectionChangeMessage {
  type: "selection-change";
  selectedIds: string[];
}

type PluginMessage = TextListMessage | SelectionChangeMessage;

const MARKDOWN_HEADER = "| 日本語 | 英語 | メモ |";
const MARKDOWN_SEPARATOR = "|--------|------|------|";
const COPIED_FEEDBACK_DURATION_MS = 2000;

function generateMarkdownTable(texts: string[]): string {
  const rows = texts.map((text) => `| ${text} |  |  |`);
  return [MARKDOWN_HEADER, MARKDOWN_SEPARATOR, ...rows].join("\n");
}

function postToPlugin(message: { type: string; ids?: string[] }): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function App() {
  const [items, setItems] = useState<TextNodeInfo[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const itemsRef = useRef<TextNodeInfo[]>([]);
  itemsRef.current = items;

  const checkedCount = checkedIds.size;
  const allChecked = items.length > 0 && checkedCount === items.length;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginMessage | undefined;

      if (msg?.type === "text-list") {
        setItems(msg.texts);
        setLoading(false);
        return;
      }

      if (msg?.type === "selection-change") {
        const knownIds = new Set(itemsRef.current.map((item) => item.id));
        const selectedInList = msg.selectedIds.filter((id) => knownIds.has(id));
        if (selectedInList.length === 0) {
          return;
        }
        // Canvas clicks replace the Figma selection (single-select), so accumulate
        // them into the checked set instead of overwriting previous checks.
        setCheckedIds((prev) => {
          const next = new Set(prev);
          for (const id of selectedInList) {
            next.add(id);
          }
          return next;
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setCopied(false);
    postToPlugin({ type: "refresh" });
  };

  const handleClose = () => {
    postToPlugin({ type: "close" });
  };

  const syncSelectionToCanvas = useCallback((ids: Set<string>) => {
    postToPlugin({ type: "select-nodes", ids: Array.from(ids) });
  }, []);

  const handleToggleItem = useCallback(
    (id: string) => {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        syncSelectionToCanvas(next);
        return next;
      });
    },
    [syncSelectionToCanvas]
  );

  const handleToggleAll = useCallback(() => {
    const next = allChecked
      ? new Set<string>()
      : new Set(items.map((item) => item.id));
    setCheckedIds(next);
    syncSelectionToCanvas(next);
  }, [allChecked, items, syncSelectionToCanvas]);

  const selectedTexts = useMemo(
    () => items.filter((item) => checkedIds.has(item.id)).map((item) => item.text),
    [items, checkedIds]
  );

  const handleOk = useCallback(async () => {
    const markdown = generateMarkdownTable(selectedTexts);

    const showCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION_MS);
    };

    try {
      await navigator.clipboard.writeText(markdown);
      showCopied();
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
      showCopied();
    }
  }, [selectedTexts]);

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
              disabled={items.length === 0}
            />
            <span>
              {items.length} text nodes found
              {checkedCount > 0 && ` (${checkedCount} selected)`}
            </span>
          </label>
        )}
      </div>

      <main className="list">
        {!loading && items.length === 0 && (
          <p className="empty">No text nodes found on this page.</p>
        )}
        {items.map((item) => (
          <label key={item.id} className="list-item checkbox-item">
            <input
              type="checkbox"
              checked={checkedIds.has(item.id)}
              onChange={() => handleToggleItem(item.id)}
            />
            <span className="item-text">{item.text}</span>
          </label>
        ))}
      </main>

      {checkedCount > 0 && (
        <footer className="footer">
          <button className="btn btn-ok" onClick={handleOk}>
            OK ({checkedCount} selected)
          </button>
        </footer>
      )}

      <div
        className={`toast ${copied ? "toast-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="toast-icon" aria-hidden="true">
          ✓
        </span>
        <span>クリップボードにコピーしました</span>
      </div>
    </div>
  );
}

export default App;
