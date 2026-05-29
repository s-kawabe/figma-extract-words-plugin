const UI_WIDTH = 400;
const UI_HEIGHT = 500;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });

interface TextNodeInfo {
  id: string;
  text: string;
}

function walkTextNodes(node: BaseNode): TextNodeInfo[] {
  const result: TextNodeInfo[] = [];

  if (node.type === "TEXT") {
    const content = node.characters.trim();
    if (content.length > 0) {
      result.push({ id: node.id, text: content });
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      result.push(...walkTextNodes(child));
    }
  }

  return result;
}

function extractTexts(): TextNodeInfo[] {
  const selection = figma.currentPage.selection;

  if (selection.length > 0) {
    const result: TextNodeInfo[] = [];
    for (const node of selection) {
      result.push(...walkTextNodes(node));
    }
    return result;
  }

  return walkTextNodes(figma.currentPage);
}

function postTextList(): void {
  figma.ui.postMessage({
    type: "text-list",
    texts: extractTexts(),
  });
}

function postSelection(): void {
  figma.ui.postMessage({
    type: "selection-change",
    selectedIds: figma.currentPage.selection.map((node) => node.id),
  });
}

async function selectNodesById(ids: string[]): Promise<void> {
  const nodes = await Promise.all(ids.map((id) => figma.getNodeByIdAsync(id)));
  const sceneNodes = nodes.filter(
    (node): node is SceneNode =>
      node !== null && node.type !== "DOCUMENT" && node.type !== "PAGE"
  );
  figma.currentPage.selection = sceneNodes;
}

postTextList();
postSelection();

figma.on("selectionchange", () => {
  postSelection();
});

figma.ui.onmessage = async (msg: { type: string; ids?: string[] }) => {
  if (msg.type === "refresh") {
    postTextList();
    postSelection();
    return;
  }

  if (msg.type === "select-nodes") {
    await selectNodesById(msg.ids ?? []);
    return;
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
