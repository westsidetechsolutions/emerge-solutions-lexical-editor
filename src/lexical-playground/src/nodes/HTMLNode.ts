import {EditorConfig, NodeKey, SerializedElementNode} from 'lexical';
import {ElementNode} from 'lexical';

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
    return div;
  }

  updateDOM(): boolean {
    return true;
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

  exportDOM(): {element: HTMLElement} {
    const div = document.createElement('div');
    div.innerHTML = this.__html;
    return {element: div};
  }
}

export function $createHTMLNode(html: string): HTMLNode {
  return new HTMLNode(html);
}

export function $isHTMLNode(node: any): node is HTMLNode {
  return node instanceof HTMLNode;
}

interface SerializedHTMLNode extends SerializedElementNode {
  html: string;
  type: 'html';
  version: 1;
} 