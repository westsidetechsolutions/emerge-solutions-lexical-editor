/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getRoot} from 'lexical';
import {useCallback, useEffect,useState} from 'react';
import * as React from 'react';

export function HTMLViewButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isHTMLView, setIsHTMLView] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const toggleHTMLView = useCallback(() => {
    setIsHTMLView((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isHTMLView) {
      editor.update(() => {
        const htmlString = $generateHtmlFromNodes(editor);
        setHtmlContent(htmlString);
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

  const applyHTMLChanges = useCallback(() => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(htmlContent, 'text/html');
    editor.update(() => {
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().clear();
      $getRoot().append(...nodes);
    });
  }, [editor, htmlContent]);

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
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            height: 'calc(100% - 60px)',
            padding: '10px',
            position: 'fixed',
            right: '0',
            top: '60px',
            width: '400px',
            zIndex: 100,
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
            <h3 style={{margin: 0}}>HTML View</h3>
            <button onClick={toggleHTMLView}>Close</button>
          </div>
          <textarea
            value={htmlContent}
            onChange={handleHTMLChange}
            onBlur={applyHTMLChanges}
            style={{
              border: '1px solid #ccc',
              fontFamily: 'monospace',
              height: 'calc(100% - 40px)',
              resize: 'none',
              width: '100%',
            }}
          />
        </div>
      )}
    </>
  );
}

export default function HTMLViewPlugin(): null {
  return null;
}
