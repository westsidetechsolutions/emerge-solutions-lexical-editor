/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $insertDataTransferForRichText, copyToClipboard } from '@lexical/clipboard';
import { $shouldOverrideDefaultCharacterSelection, $moveCharacter } from '@lexical/selection';
import { addClassNamesToElement, isHTMLElement, objectKlassEquals, mergeRegister, $findMatchingParent, $getNearestBlockElementAncestorOrThrow } from '@lexical/utils';
import { createCommand, ElementNode, $createParagraphNode, $applyNodeReplacement, setNodeIndentFromDOM, CLICK_COMMAND, $getSelection, $isNodeSelection, DELETE_CHARACTER_COMMAND, $isRangeSelection, COMMAND_PRIORITY_EDITOR, DELETE_WORD_COMMAND, DELETE_LINE_COMMAND, CONTROLLED_TEXT_INSERTION_COMMAND, REMOVE_TEXT_COMMAND, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, $isElementNode, INSERT_LINE_BREAK_COMMAND, INSERT_PARAGRAPH_COMMAND, INSERT_TAB_COMMAND, $insertNodes, $createTabNode, INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, KEY_ARROW_UP_COMMAND, $getAdjacentNode, $isDecoratorNode, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_BACKSPACE_COMMAND, $isRootNode, KEY_DELETE_COMMAND, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, DROP_COMMAND, $getNearestNodeFromDOMNode, $createRangeSelection, $isTextNode, $normalizeSelection__EXPERIMENTAL, $setSelection, DRAGSTART_COMMAND, DRAGOVER_COMMAND, SELECT_ALL_COMMAND, $selectAll, COPY_COMMAND, CUT_COMMAND, PASTE_COMMAND, isSelectionCapturedInDecoratorInput, $getRoot } from 'lexical';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function caretFromPoint(x, y) {
  if (typeof document.caretRangeFromPoint !== 'undefined') {
    const range = document.caretRangeFromPoint(x, y);
    if (range === null) {
      return null;
    }
    return {
      node: range.startContainer,
      offset: range.startOffset
    };
    // @ts-ignore
  } else if (document.caretPositionFromPoint !== 'undefined') {
    // @ts-ignore FF - no types
    const range = document.caretPositionFromPoint(x, y);
    if (range === null) {
      return null;
    }
    return {
      node: range.offsetNode,
      offset: range.offset
    };
  } else {
    // Gracefully handle IE
    return null;
  }
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const CAN_USE_DOM = typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const documentMode = CAN_USE_DOM && 'documentMode' in document ? document.documentMode : null;
const CAN_USE_BEFORE_INPUT = CAN_USE_DOM && 'InputEvent' in window && !documentMode ? 'getTargetRanges' in new window.InputEvent('input') : false;
const IS_SAFARI = CAN_USE_DOM && /Version\/[\d.]+.*Safari/.test(navigator.userAgent);
const IS_IOS = CAN_USE_DOM && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Keep these in case we need to use them in the future.
// export const IS_WINDOWS: boolean = CAN_USE_DOM && /Win/.test(navigator.platform);
const IS_CHROME = CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent);
const IS_APPLE_WEBKIT = CAN_USE_DOM && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !IS_CHROME;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const DRAG_DROP_PASTE = createCommand('DRAG_DROP_PASTE_FILE');
/** @noInheritDoc */
class QuoteNode extends ElementNode {
  static getType() {
    return 'quote';
  }
  static clone(node) {
    return new QuoteNode(node.__key);
  }
  constructor(key) {
    super(key);
  }

  // View

  createDOM(config) {
    const element = document.createElement('blockquote');
    addClassNamesToElement(element, config.theme.quote);
    return element;
  }
  updateDOM(prevNode, dom) {
    return false;
  }
  static importDOM() {
    return {
      blockquote: node => ({
        conversion: $convertBlockquoteElement,
        priority: 0
      })
    };
  }
  exportDOM(editor) {
    const {
      element
    } = super.exportDOM(editor);
    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) {
        element.append(document.createElement('br'));
      }
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;
      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
      }
    }
    return {
      element
    };
  }
  static importJSON(serializedNode) {
    const node = $createQuoteNode();
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'quote'
    };
  }

  // Mutation

  insertNewAfter(_, restoreSelection) {
    const newBlock = $createParagraphNode();
    const direction = this.getDirection();
    newBlock.setDirection(direction);
    this.insertAfter(newBlock, restoreSelection);
    return newBlock;
  }
  collapseAtStart() {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach(child => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }
  canMergeWhenEmpty() {
    return true;
  }
}
function $createQuoteNode() {
  return $applyNodeReplacement(new QuoteNode());
}
function $isQuoteNode(node) {
  return node instanceof QuoteNode;
}
/** @noInheritDoc */
class HeadingNode extends ElementNode {
  /** @internal */

  static getType() {
    return 'heading';
  }
  static clone(node) {
    return new HeadingNode(node.__tag, node.__key);
  }
  constructor(tag, key) {
    super(key);
    this.__tag = tag;
  }
  getTag() {
    return this.__tag;
  }

  // View

  createDOM(config) {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const theme = config.theme;
    const classNames = theme.heading;
    if (classNames !== undefined) {
      const className = classNames[tag];
      addClassNamesToElement(element, className);
    }
    return element;
  }
  updateDOM(prevNode, dom) {
    return false;
  }
  static importDOM() {
    return {
      h1: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      h2: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      h3: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      h4: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      h5: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      h6: node => ({
        conversion: $convertHeadingElement,
        priority: 0
      }),
      p: node => {
        // domNode is a <p> since we matched it by nodeName
        const paragraph = node;
        const firstChild = paragraph.firstChild;
        if (firstChild !== null && isGoogleDocsTitle(firstChild)) {
          return {
            conversion: () => ({
              node: null
            }),
            priority: 3
          };
        }
        return null;
      },
      span: node => {
        if (isGoogleDocsTitle(node)) {
          return {
            conversion: domNode => {
              return {
                node: $createHeadingNode('h1')
              };
            },
            priority: 3
          };
        }
        return null;
      }
    };
  }
  exportDOM(editor) {
    const {
      element
    } = super.exportDOM(editor);
    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) {
        element.append(document.createElement('br'));
      }
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;
      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
      }
    }
    return {
      element
    };
  }
  static importJSON(serializedNode) {
    const node = $createHeadingNode(serializedNode.tag);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      tag: this.getTag(),
      type: 'heading',
      version: 1
    };
  }

  // Mutation
  insertNewAfter(selection, restoreSelection = true) {
    const anchorOffet = selection ? selection.anchor.offset : 0;
    const lastDesc = this.getLastDescendant();
    const isAtEnd = !lastDesc || selection && selection.anchor.key === lastDesc.getKey() && anchorOffet === lastDesc.getTextContentSize();
    const newElement = isAtEnd || !selection ? $createParagraphNode() : $createHeadingNode(this.getTag());
    const direction = this.getDirection();
    newElement.setDirection(direction);
    this.insertAfter(newElement, restoreSelection);
    if (anchorOffet === 0 && !this.isEmpty() && selection) {
      const paragraph = $createParagraphNode();
      paragraph.select();
      this.replace(paragraph, true);
    }
    return newElement;
  }
  collapseAtStart() {
    const newElement = !this.isEmpty() ? $createHeadingNode(this.getTag()) : $createParagraphNode();
    const children = this.getChildren();
    children.forEach(child => newElement.append(child));
    this.replace(newElement);
    return true;
  }
  extractWithChild() {
    return true;
  }
}
function isGoogleDocsTitle(domNode) {
  if (domNode.nodeName.toLowerCase() === 'span') {
    return domNode.style.fontSize === '26pt';
  }
  return false;
}
function $convertHeadingElement(element) {
  const nodeName = element.nodeName.toLowerCase();
  let node = null;
  if (nodeName === 'h1' || nodeName === 'h2' || nodeName === 'h3' || nodeName === 'h4' || nodeName === 'h5' || nodeName === 'h6') {
    node = $createHeadingNode(nodeName);
    if (element.style !== null) {
      setNodeIndentFromDOM(element, node);
      node.setFormat(element.style.textAlign);
    }
  }
  return {
    node
  };
}
function $convertBlockquoteElement(element) {
  const node = $createQuoteNode();
  if (element.style !== null) {
    node.setFormat(element.style.textAlign);
    setNodeIndentFromDOM(element, node);
  }
  return {
    node
  };
}
function $createHeadingNode(headingTag) {
  return $applyNodeReplacement(new HeadingNode(headingTag));
}
function $isHeadingNode(node) {
  return node instanceof HeadingNode;
}
function onPasteForRichText(event, editor) {
  event.preventDefault();
  editor.update(() => {
    const selection = $getSelection();
    const clipboardData = objectKlassEquals(event, InputEvent) || objectKlassEquals(event, KeyboardEvent) ? null : event.clipboardData;
    if (clipboardData != null && selection !== null) {
      $insertDataTransferForRichText(clipboardData, selection, editor);
    }
  }, {
    tag: 'paste'
  });
}
async function onCutForRichText(event, editor) {
  await copyToClipboard(editor, objectKlassEquals(event, ClipboardEvent) ? event : null);
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.removeText();
    } else if ($isNodeSelection(selection)) {
      selection.getNodes().forEach(node => node.remove());
    }
  });
}

// Clipboard may contain files that we aren't allowed to read. While the event is arguably useless,
// in certain occasions, we want to know whether it was a file transfer, as opposed to text. We
// control this with the first boolean flag.
function eventFiles(event) {
  let dataTransfer = null;
  if (objectKlassEquals(event, DragEvent)) {
    dataTransfer = event.dataTransfer;
  } else if (objectKlassEquals(event, ClipboardEvent)) {
    dataTransfer = event.clipboardData;
  }
  if (dataTransfer === null) {
    return [false, [], false];
  }
  const types = dataTransfer.types;
  const hasFiles = types.includes('Files');
  const hasContent = types.includes('text/html') || types.includes('text/plain');
  return [hasFiles, Array.from(dataTransfer.files), hasContent];
}
function $handleIndentAndOutdent(indentOrOutdent) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const alreadyHandled = new Set();
  const nodes = selection.getNodes();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const key = node.getKey();
    if (alreadyHandled.has(key)) {
      continue;
    }
    const parentBlock = $findMatchingParent(node, parentNode => $isElementNode(parentNode) && !parentNode.isInline());
    if (parentBlock === null) {
      continue;
    }
    const parentKey = parentBlock.getKey();
    if (parentBlock.canIndent() && !alreadyHandled.has(parentKey)) {
      alreadyHandled.add(parentKey);
      indentOrOutdent(parentBlock);
    }
  }
  return alreadyHandled.size > 0;
}
function $isTargetWithinDecorator(target) {
  const node = $getNearestNodeFromDOMNode(target);
  return $isDecoratorNode(node);
}
function $isSelectionAtEndOfRoot(selection) {
  const focus = selection.focus;
  return focus.key === 'root' && focus.offset === $getRoot().getChildrenSize();
}
function registerRichText(editor) {
  const removeListener = mergeRegister(editor.registerCommand(CLICK_COMMAND, payload => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      selection.clear();
      return true;
    }
    return false;
  }, 0), editor.registerCommand(DELETE_CHARACTER_COMMAND, isBackward => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.deleteCharacter(isBackward);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(DELETE_WORD_COMMAND, isBackward => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.deleteWord(isBackward);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(DELETE_LINE_COMMAND, isBackward => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.deleteLine(isBackward);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(CONTROLLED_TEXT_INSERTION_COMMAND, eventOrText => {
    const selection = $getSelection();
    if (typeof eventOrText === 'string') {
      if (selection !== null) {
        selection.insertText(eventOrText);
      }
    } else {
      if (selection === null) {
        return false;
      }
      const dataTransfer = eventOrText.dataTransfer;
      if (dataTransfer != null) {
        $insertDataTransferForRichText(dataTransfer, selection, editor);
      } else if ($isRangeSelection(selection)) {
        const data = eventOrText.data;
        if (data) {
          selection.insertText(data);
        }
        return true;
      }
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(REMOVE_TEXT_COMMAND, () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.removeText();
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(FORMAT_TEXT_COMMAND, format => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.formatText(format);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(FORMAT_ELEMENT_COMMAND, format => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) && !$isNodeSelection(selection)) {
      return false;
    }
    const nodes = selection.getNodes();
    for (const node of nodes) {
      const element = $findMatchingParent(node, parentNode => $isElementNode(parentNode) && !parentNode.isInline());
      if (element !== null) {
        element.setFormat(format);
      }
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(INSERT_LINE_BREAK_COMMAND, selectStart => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.insertLineBreak(selectStart);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    selection.insertParagraph();
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(INSERT_TAB_COMMAND, () => {
    $insertNodes([$createTabNode()]);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(INDENT_CONTENT_COMMAND, () => {
    return $handleIndentAndOutdent(block => {
      const indent = block.getIndent();
      block.setIndent(indent + 1);
    });
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(OUTDENT_CONTENT_COMMAND, () => {
    return $handleIndentAndOutdent(block => {
      const indent = block.getIndent();
      if (indent > 0) {
        block.setIndent(indent - 1);
      }
    });
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ARROW_UP_COMMAND, event => {
    const selection = $getSelection();
    if ($isNodeSelection(selection) && !$isTargetWithinDecorator(event.target)) {
      // If selection is on a node, let's try and move selection
      // back to being a range selection.
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        nodes[0].selectPrevious();
        return true;
      }
    } else if ($isRangeSelection(selection)) {
      const possibleNode = $getAdjacentNode(selection.focus, true);
      if (!event.shiftKey && $isDecoratorNode(possibleNode) && !possibleNode.isIsolated() && !possibleNode.isInline()) {
        possibleNode.selectPrevious();
        event.preventDefault();
        return true;
      }
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ARROW_DOWN_COMMAND, event => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      // If selection is on a node, let's try and move selection
      // back to being a range selection.
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        nodes[0].selectNext(0, 0);
        return true;
      }
    } else if ($isRangeSelection(selection)) {
      if ($isSelectionAtEndOfRoot(selection)) {
        event.preventDefault();
        return true;
      }
      const possibleNode = $getAdjacentNode(selection.focus, false);
      if (!event.shiftKey && $isDecoratorNode(possibleNode) && !possibleNode.isIsolated() && !possibleNode.isInline()) {
        possibleNode.selectNext();
        event.preventDefault();
        return true;
      }
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ARROW_LEFT_COMMAND, event => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      // If selection is on a node, let's try and move selection
      // back to being a range selection.
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        event.preventDefault();
        nodes[0].selectPrevious();
        return true;
      }
    }
    if (!$isRangeSelection(selection)) {
      return false;
    }
    if ($shouldOverrideDefaultCharacterSelection(selection, true)) {
      const isHoldingShift = event.shiftKey;
      event.preventDefault();
      $moveCharacter(selection, isHoldingShift, true);
      return true;
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, event => {
    const selection = $getSelection();
    if ($isNodeSelection(selection) && !$isTargetWithinDecorator(event.target)) {
      // If selection is on a node, let's try and move selection
      // back to being a range selection.
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        event.preventDefault();
        nodes[0].selectNext(0, 0);
        return true;
      }
    }
    if (!$isRangeSelection(selection)) {
      return false;
    }
    const isHoldingShift = event.shiftKey;
    if ($shouldOverrideDefaultCharacterSelection(selection, false)) {
      event.preventDefault();
      $moveCharacter(selection, isHoldingShift, false);
      return true;
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_BACKSPACE_COMMAND, event => {
    if ($isTargetWithinDecorator(event.target)) {
      return false;
    }
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    event.preventDefault();
    const {
      anchor
    } = selection;
    const anchorNode = anchor.getNode();
    if (selection.isCollapsed() && anchor.offset === 0 && !$isRootNode(anchorNode)) {
      const element = $getNearestBlockElementAncestorOrThrow(anchorNode);
      if (element.getIndent() > 0) {
        return editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
      }
    }
    return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_DELETE_COMMAND, event => {
    if ($isTargetWithinDecorator(event.target)) {
      return false;
    }
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    event.preventDefault();
    return editor.dispatchCommand(DELETE_CHARACTER_COMMAND, false);
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ENTER_COMMAND, event => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    if (event !== null) {
      // If we have beforeinput, then we can avoid blocking
      // the default behavior. This ensures that the iOS can
      // intercept that we're actually inserting a paragraph,
      // and autocomplete, autocapitalize etc work as intended.
      // This can also cause a strange performance issue in
      // Safari, where there is a noticeable pause due to
      // preventing the key down of enter.
      if ((IS_IOS || IS_SAFARI || IS_APPLE_WEBKIT) && CAN_USE_BEFORE_INPUT) {
        return false;
      }
      event.preventDefault();
      if (event.shiftKey) {
        return editor.dispatchCommand(INSERT_LINE_BREAK_COMMAND, false);
      }
    }
    return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(KEY_ESCAPE_COMMAND, () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    editor.blur();
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(DROP_COMMAND, event => {
    const [, files] = eventFiles(event);
    if (files.length > 0) {
      const x = event.clientX;
      const y = event.clientY;
      const eventRange = caretFromPoint(x, y);
      if (eventRange !== null) {
        const {
          offset: domOffset,
          node: domNode
        } = eventRange;
        const node = $getNearestNodeFromDOMNode(domNode);
        if (node !== null) {
          const selection = $createRangeSelection();
          if ($isTextNode(node)) {
            selection.anchor.set(node.getKey(), domOffset, 'text');
            selection.focus.set(node.getKey(), domOffset, 'text');
          } else {
            const parentKey = node.getParentOrThrow().getKey();
            const offset = node.getIndexWithinParent() + 1;
            selection.anchor.set(parentKey, offset, 'element');
            selection.focus.set(parentKey, offset, 'element');
          }
          const normalizedSelection = $normalizeSelection__EXPERIMENTAL(selection);
          $setSelection(normalizedSelection);
        }
        editor.dispatchCommand(DRAG_DROP_PASTE, files);
      }
      event.preventDefault();
      return true;
    }
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      return true;
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(DRAGSTART_COMMAND, event => {
    const [isFileTransfer] = eventFiles(event);
    const selection = $getSelection();
    if (isFileTransfer && !$isRangeSelection(selection)) {
      return false;
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(DRAGOVER_COMMAND, event => {
    const [isFileTransfer] = eventFiles(event);
    const selection = $getSelection();
    if (isFileTransfer && !$isRangeSelection(selection)) {
      return false;
    }
    const x = event.clientX;
    const y = event.clientY;
    const eventRange = caretFromPoint(x, y);
    if (eventRange !== null) {
      const node = $getNearestNodeFromDOMNode(eventRange.node);
      if ($isDecoratorNode(node)) {
        // Show browser caret as the user is dragging the media across the screen. Won't work
        // for DecoratorNode nor it's relevant.
        event.preventDefault();
      }
    }
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(SELECT_ALL_COMMAND, () => {
    $selectAll();
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(COPY_COMMAND, event => {
    copyToClipboard(editor, objectKlassEquals(event, ClipboardEvent) ? event : null);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(CUT_COMMAND, event => {
    onCutForRichText(event, editor);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(PASTE_COMMAND, event => {
    const [, files, hasTextContent] = eventFiles(event);
    if (files.length > 0 && !hasTextContent) {
      editor.dispatchCommand(DRAG_DROP_PASTE, files);
      return true;
    }

    // if inputs then paste within the input ignore creating a new node on paste event
    if (isSelectionCapturedInDecoratorInput(event.target)) {
      return false;
    }
    const selection = $getSelection();
    if (selection !== null) {
      onPasteForRichText(event, editor);
      return true;
    }
    return false;
  }, COMMAND_PRIORITY_EDITOR));
  return removeListener;
}

export { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, DRAG_DROP_PASTE, HeadingNode, QuoteNode, eventFiles, registerRichText };
