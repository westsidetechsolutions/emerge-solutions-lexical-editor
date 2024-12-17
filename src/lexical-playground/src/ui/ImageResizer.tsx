/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import './ImageResizer.css';

enum Direction {
  north = 1,
  south = 2,
  west = 4,
  east = 8,
}

interface ImageResizerProps {
  onResizeStart: () => void;
  onResizeEnd: (width: 'inherit' | number, height: 'inherit' | number) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  imageRef: React.RefObject<HTMLElement>;
  editor: LexicalEditor;
  showCaption: boolean;
  setShowCaption: (show: boolean) => void;
  captionsEnabled: boolean;
  maxWidth?: number;
}

export default function ImageResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  imageRef,
  editor,
  showCaption,
  setShowCaption,
  captionsEnabled,
  maxWidth,
}: ImageResizerProps): JSX.Element {
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, direction: Direction) => {
      event.preventDefault();
      onResizeStart();

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = imageRef.current
        ? imageRef.current.getBoundingClientRect().width
        : 0;
      const startHeight = imageRef.current
        ? imageRef.current.getBoundingClientRect().height
        : 0;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const image = imageRef.current;
        if (!image) return;

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Check if we're doing a diagonal resize
        const isDiagonal = (
          (direction & Direction.north && direction & Direction.east) ||
          (direction & Direction.south && direction & Direction.west) ||
          (direction & Direction.north && direction & Direction.west) ||
          (direction & Direction.south && direction & Direction.east)
        );

        if (isDiagonal) {
          // For diagonal, maintain aspect ratio
          const aspectRatio = startWidth / startHeight;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newWidth = direction & Direction.east ? 
              startWidth + deltaX : 
              startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = direction & Direction.south ? 
              startHeight + deltaY : 
              startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
          }
        } else {
          // For non-diagonal, allow independent resizing
          if (direction & Direction.east) newWidth = startWidth + deltaX;
          if (direction & Direction.west) newWidth = startWidth - deltaX;
          if (direction & Direction.south) newHeight = startHeight + deltaY;
          if (direction & Direction.north) newHeight = startHeight - deltaY;
        }

        // Apply minimum dimensions
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        if (maxWidth) {
          newWidth = Math.min(newWidth, maxWidth);
          if (isDiagonal) {
            // Only adjust height based on aspect ratio if it's a diagonal resize
            const aspectRatio = startWidth / startHeight;
            newHeight = newWidth / aspectRatio;
          }
        }

        image.style.width = `${newWidth}px`;
        image.style.height = `${newHeight}px`;
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        onResizeEnd(
          imageRef.current ? parseInt(imageRef.current.style.width) : 'inherit',
          imageRef.current ? parseInt(imageRef.current.style.height) : 'inherit',
        );
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [imageRef, maxWidth, onResizeEnd, onResizeStart],
  );

  return (
    <>
      {/* Resize handles */}
      <div
        className="image-resizer e-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.east)}
      />
      <div
        className="image-resizer w-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.west)}
      />
      <div
        className="image-resizer s-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.south)}
      />
      <div
        className="image-resizer n-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.north)}
      />
      <div
        className="image-resizer se-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.south | Direction.east)}
      />
      <div
        className="image-resizer sw-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.south | Direction.west)}
      />
      <div
        className="image-resizer ne-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.north | Direction.east)}
      />
      <div
        className="image-resizer nw-resize"
        onPointerDown={(e) => handlePointerDown(e, Direction.north | Direction.west)}
      />
    </>
  );
}
