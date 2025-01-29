import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getRoot,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
} from 'lexical';

export type SerializedHTMLNode = SerializedElementNode & {
  html: string;
  type: 'html';
  version: 1;
};

export class HTMLNode extends ElementNode {
  __html: string;

  static getType(): string {
    return 'html';
  }

  static clone(node: HTMLNode): HTMLNode {
    return new HTMLNode(node.__html, node.__key);
  }

  constructor(html: string, key?: NodeKey) {
    super(key);
    this.__html = html;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = this.__html;
    // Make the node contenteditable to allow selection
    div.contentEditable = 'true';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: Node) => ({
        conversion: convertDivElement,
        priority: 1,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('div');
    element.innerHTML = this.__html;
    return { element };
  }

  static importJSON(serializedNode: SerializedHTMLNode): HTMLNode {
    const node = $createHTMLNode(serializedNode.html);
    return node;
  }

  exportJSON(): SerializedHTMLNode {
    return {
      ...super.exportJSON(),
      html: this.__html,
      type: 'html',
      version: 1,
    };
  }

  // Enable selection
  isInline(): boolean {
    return false;
  }

  // Enable copy/paste
  extractWithChild(): boolean {
    return true;
  }

  // Enable selection highlighting
  isSelectable(): boolean {
    return true;
  }

  // Handle selection
  selectStart(): RangeSelection {
    const firstChild = this.getFirstChild();
    if (firstChild) {
      return firstChild.selectStart();
    }
    return this.select();
  }

  selectEnd(): RangeSelection {
    const lastChild = this.getLastChild();
    if (lastChild) {
      return lastChild.selectEnd();
    }
    return this.select();
  }

  // Handle formatting
  canInsertTextBefore(): boolean {
    return true;
  }

  canInsertTextAfter(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  // Handle splitting and merging
  canMergeWith(node: LexicalNode): boolean {
    return node instanceof HTMLNode;
  }

  // Support for text content
  getTextContent(): string {
    const div = document.createElement('div');
    div.innerHTML = this.__html;
    return div.textContent || '';
  }

  // Handle backspace/delete
  collapseAtStart(): boolean {
    const paragraph = $createParagraphNode();
    this.replace(paragraph);
    return true;
  }
}

function convertDivElement(domNode: Node): DOMConversionOutput {
  const div = domNode as HTMLElement;
  const html = div.innerHTML;
  const node = $createHTMLNode(html);
  return { node };
}

export function $createHTMLNode(html: string): HTMLNode {
  return $applyNodeReplacement(new HTMLNode(html));
}

export function $isHTMLNode(node: LexicalNode | null | undefined): node is HTMLNode {
  return node instanceof HTMLNode;
} 