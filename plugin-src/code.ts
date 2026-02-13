const UI_WIDTH = 400;
const UI_HEIGHT = 500;

figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });

function walkTextNodes(node: BaseNode): string[] {
  const texts: string[] = [];

  if (node.type === "TEXT") {
    const content = node.characters.trim();
    if (content.length > 0) {
      texts.push(content);
    }
  }

  if ("children" in node) {
    for (const child of node.children) {
      texts.push(...walkTextNodes(child));
    }
  }

  return texts;
}

function extractTextsFromCurrentPage(): string[] {
  return walkTextNodes(figma.currentPage);
}

figma.ui.postMessage({
  type: "text-list",
  texts: extractTextsFromCurrentPage(),
});

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === "refresh") {
    figma.ui.postMessage({
      type: "text-list",
      texts: extractTextsFromCurrentPage(),
    });
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
