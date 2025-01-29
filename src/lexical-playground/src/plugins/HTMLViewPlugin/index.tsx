/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getRoot, $insertNodes} from 'lexical';
import {useCallback, useEffect, useRef, useState} from 'react';
import * as React from 'react';
import Modal from '../../ui/Modal';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // For HTML syntax
import 'prismjs/themes/prism.css'; // Base theme
import {HTMLNode, $createHTMLNode} from '../../nodes/HTMLNode';

type ResizeDirection = 'e' | 'w' | 's' | 'n' | 'se' | 'sw' | 'ne' | 'nw';

const RESIZE_HANDLE_CLASS = "w-3 h-3 absolute bg-primary/20 hover:bg-primary/40 transition-colors";

// Add custom styles for the colors we want
const CUSTOM_STYLE = `
.token.tag { color: #A94442; }
.token.attr-name { color: #FF0000; }
.token.attr-value { color: #0000FF; }

.html-view {
  position: relative;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.html-view pre {
  margin: 0;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 16px;
  pointer-events: none;
  user-select: none;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}

.html-view pre code {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  tab-size: 2;
  white-space: pre-wrap;
  word-break: break-word;
}

.html-view textarea {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
  resize: none;
  border: none;
  color: transparent;
  caret-color: black;
  z-index: 1;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}
`;

export function HTMLViewButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isHTMLView, setIsHTMLView] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  const toggleHTMLView = useCallback(() => {
    setIsHTMLView((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isHTMLView) {
      editor.update(() => {
        const root = $getRoot();
        // Find HTMLNode if it exists
        const htmlNode = root.getChildren().find(node => node instanceof HTMLNode);
        if (htmlNode) {
          setHtmlContent(htmlNode.__html);
        } else {
          // If no HTMLNode exists, generate empty content
          setHtmlContent('<p><br></p>');
        }
      });
    }
  }, [isHTMLView, editor]);

  const handleHTMLChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newHtmlContent = event.target.value;
      setHtmlContent(newHtmlContent);
    },
    [],
  );

  const handleSave = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      
      // Create a single HTMLNode with the raw HTML content
      const htmlNode = $createHTMLNode(htmlContent);
      root.append(htmlNode);
    });
    setIsHTMLView(false);
  }, [editor, htmlContent]);

  const handleResizeStart = useCallback((event: React.PointerEvent, direction: ResizeDirection) => {
    event.preventDefault();
    if (!modalRef.current) return;

    const { width, height } = modalRef.current.getBoundingClientRect();
    initialSize.current = { width, height };
    resizeStartPos.current = { x: event.clientX, y: event.clientY };
    setIsResizing(true);

    const handleResizeMove = (event: PointerEvent) => {
      if (!modalRef.current) return;

      const deltaX = event.clientX - resizeStartPos.current.x;
      const deltaY = event.clientY - resizeStartPos.current.y;

      let newWidth = initialSize.current.width;
      let newHeight = initialSize.current.height;

      if (direction.includes('e')) newWidth += deltaX;
      if (direction.includes('w')) newWidth -= deltaX;
      if (direction.includes('s')) newHeight += deltaY;
      if (direction.includes('n')) newHeight -= deltaY;

      modalRef.current.style.width = `${Math.max(newWidth, 400)}px`;
      modalRef.current.style.height = `${Math.max(newHeight, 300)}px`;
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
    };

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
  }, []);

  useEffect(() => {
    // Add our custom styles once
    if (!document.getElementById('prism-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'prism-custom-styles';
      styleEl.innerHTML = CUSTOM_STYLE;
      document.head.appendChild(styleEl);
    }
  }, []);

  return (
    <>
      <button
        onClick={toggleHTMLView}
        className={'toolbar-item spaced ' + (isHTMLView ? 'active' : '')}
        aria-label="View HTML"
        title="View HTML">
        HTML
      </button>
      {isHTMLView && (
        <Modal
          title="HTML View"
          onClose={toggleHTMLView}
          closeOnClickOutside={false}
        >
          <div 
            ref={modalRef}
            className={`flex flex-col w-[800px] h-[500px] relative ${isResizing ? 'select-none' : ''}`}
          >
            <div className="flex-1 relative mt-2 mb-4 html-view">
              <textarea
                className="absolute inset-0 w-full h-full font-mono text-sm bg-base-200 rounded-lg border border-base-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={htmlContent}
                onChange={handleHTMLChange}
              />
              <pre aria-hidden={true}>
                <code 
                  className="language-markup"
                  dangerouslySetInnerHTML={{ 
                    __html: Prism.highlight(htmlContent, Prism.languages.markup, 'markup') 
                  }} 
                />
              </pre>
              {/* Resize handles */}
              <div 
                className={`${RESIZE_HANDLE_CLASS} -right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'e')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} -left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'w')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'n')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} bottom-0 -right-1.5 cursor-se-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'se')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} bottom-0 -left-1.5 cursor-sw-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'sw')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} -top-1.5 -right-1.5 cursor-ne-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div 
                className={`${RESIZE_HANDLE_CLASS} -top-1.5 -left-1.5 cursor-nw-resize`}
                onPointerDown={(e) => handleResizeStart(e, 'nw')}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
              <button
                className="btn btn-sm btn-ghost"
                onClick={toggleHTMLView}>
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-primary"
                onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function HTMLViewPlugin(): null {
  return null;
}
