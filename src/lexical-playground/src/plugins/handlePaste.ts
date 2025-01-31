import { $getRoot, $insertNodes } from 'lexical';
import { HTMLContainerNode } from '../nodes/HTMLContainerNode';
import { EditableTextNode } from '../nodes/EditableTextNode';

/** Handles pasting HTML into Lexical */
export function handlePaste(event: ClipboardEvent, editor: LexicalEditor) {
  event.preventDefault();
  const html = event.clipboardData?.getData('text/html');

  if (!html) return;

  // Parse the HTML string
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const body = dom.body;

  // Function to recursively convert DOM nodes to Lexical nodes
  const convertDOMToLexical = (domNode: Node): LexicalNode[] => {
    const nodes: LexicalNode[] = [];

    domNode.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent?.trim();
        if (textContent) {
          nodes.push(new EditableTextNode(textContent));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const style = element.getAttribute('style') || '';

        // Create a container node for the element
        const containerNode = new HTMLContainerNode(tagName, style);
        const childNodes = convertDOMToLexical(element);

        if (childNodes.length > 0) {
          childNodes.forEach((node) => containerNode.append(node));
        }

        nodes.push(containerNode);
      }
    });

    return nodes;
  };

  // Convert the parsed HTML to Lexical nodes
  const lexicalNodes = convertDOMToLexical(body);

  // Insert the nodes into the editor
  editor.update(() => {
    const root = $getRoot();
    lexicalNodes.forEach((node) => root.append(node));
  });
} 