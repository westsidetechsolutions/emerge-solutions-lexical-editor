/* eslint-disable */
// @ts-nocheck

import React, {useEffect, useState} from 'react';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import './AssetManager.css';
import { useAssetStore } from '../../stores/assetStore'

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

const FolderTreeItem = ({
  folder,
  level = 0,
  selectedFolderId,
  onFolderSelect,
  onFolderToggle,
  onFolderRename,
  onFolderDelete,
}: {
  folder: Folder;
  level?: number;
  selectedFolderId: string;
  onFolderSelect: (folder: Folder) => void;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onFolderSelect(folder);
    }
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onFolderToggle(folder.id);
    }
  };

  const isFolderEmpty = (folder: Folder): boolean => {
    return folder.children.every((child) => {
      if ('children' in child) {
        return isFolderEmpty(child);
      }
      return false;  // If it's an asset, folder is not empty
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolderEmpty(folder)) {
      onFolderDelete(folder.id);
    }
  };

  return (
    <div style={{paddingLeft: `${level * 16}px`}}>
      <div
        className={`folder-tree-item ${
          selectedFolderId === folder.id ? 'selected' : ''
        }`}
        style={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <span
          className="folder-toggle"
          onClick={() => onFolderToggle(folder.id)}
          onKeyDown={handleToggleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`Toggle ${folder.name} folder`}>
          {folder.children.some((child) => 'children' in child)
            ? folder.isExpanded
              ? '▾'
              : '▸'
            : ''}
        </span>

        {isRenaming ? (
          <div className="rename-container">
            <div className="rename-input-wrapper">
              <TextInput
                value={newName}
                onChange={(value) => setNewName(value)}
                onBlur={() => {
                  onFolderRename(folder.id, newName);
                  setIsRenaming(false);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    onFolderRename(folder.id, newName);
                    setIsRenaming(false);
                  }
                  if (e.key === 'Escape') {
                    setNewName(folder.name);
                    setIsRenaming(false);
                  }
                }}
                data-test-id={`rename-folder-${folder.id}`}
              />
            </div>
            <button
              className="instagram-button"
              style={{ 
                width: 'auto', 
                marginLeft: '8px', 
                padding: '4px 8px',
                minWidth: '32px' 
              }}
              onClick={() => {
                onFolderRename(folder.id, newName);
                setIsRenaming(false);
              }}
            >
              ✓
            </button>
          </div>
        ) : (
          <div
            style={{display: 'flex', alignItems: 'center', flex: 1}}
            onClick={() => onFolderSelect(folder)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`Select ${folder.name} folder`}
            onDoubleClick={() => setIsRenaming(true)}>
            <span className="folder-icon">📁</span>
            {folder.name}
          </div>
        )}

        {!isRenaming && folder.id !== 'root' && (
          <button
            onClick={handleDelete}
            className="delete-folder-button"
            disabled={folder.children.length > 0}
            title={folder.children.length > 0 ? "Cannot delete non-empty folder" : "Delete folder"}
          >
            🗑️
          </button>
        )}
      </div>

      {folder.isExpanded &&
        folder.children.map((childItem) => {
          if ('children' in childItem) {
            return (
              <FolderTreeItem
                key={childItem.id}
                folder={childItem}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                onFolderToggle={onFolderToggle}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
              />
            );
          }
          return null;
        })}
    </div>
  );
};

const AssetGridItem = ({
  item,
  onSelect,
}: {
  item: Asset;
  onSelect: (asset: Asset) => void;
}) => {
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    // Retrieve the actual URL from sessionStorage
    const storedUrl = sessionStorage.getItem(item.url)
    if (storedUrl) {
      setUrl(storedUrl)
    }
  }, [item.url])

  return (
    <div className="asset-item">
      {url && <img src={url} alt={item.name} />}
      <div className="asset-item-overlay">
        <div className="asset-item-name">{item.name}</div>
        <button className="instagram-button" onClick={() => onSelect({...item, url})}>
          Select
        </button>
      </div>
    </div>
  );
};

export default function AssetManager({
  isOpen,
  onClose,
  onSelect,
}: AssetManagerProps): JSX.Element {
  const { 
    tree, 
    currentFolder, 
    setCurrentFolder, 
    addFolder: addFolderToStore, 
    addAsset,
    deleteFolder,
    toggleFolder, 
    renameFolder 
  } = useAssetStore();
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim() === '') return;

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      children: [],
      isExpanded: false,
    };

    addFolderToStore(currentFolder.id, newFolder);
    setNewFolderName('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const processFile = async (file: File): Promise<Asset> => {
      const id = `${Date.now()}-${file.name}`
      const reader = new FileReader()
      
      return new Promise((resolve) => {
        reader.onloadend = () => {
          const url = reader.result as string
          sessionStorage.setItem(`asset-${id}`, url)
          resolve({
            id,
            name: file.name,
            url: `asset-${id}`
          })
        }
        reader.readAsDataURL(file)
      })
    }

    const newAssets = await Promise.all(Array.from(files).map(processFile))
    newAssets.forEach(asset => {
      addAsset(currentFolder.id, asset)
    })
  }

  const handleClearStorage = () => {
    sessionStorage.clear();
    // Force a re-render of all asset items
    setCurrentFolder({...currentFolder});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="asset-manager-modal">
      <div className="asset-manager-container">
        {/* Folder Tree */}
        <div className="folder-tree">
          <div className="new-folder-section">
            <TextInput
              label="New Folder"
              value={newFolderName}
              onChange={(value) => setNewFolderName(value)}
              placeholder="Create new folder..."
            />
            <Button onClick={handleAddFolder} className="instagram-button">
              Create Folder
            </Button>
          </div>

          <FolderTreeItem
            folder={tree}
            selectedFolderId={currentFolder.id}
            onFolderSelect={setCurrentFolder}
            onFolderToggle={toggleFolder}
            onFolderRename={renameFolder}
            onFolderDelete={deleteFolder}
          />
        </div>

        {/* Asset Content */}
        <div className="asset-content">
          <div className="upload-section">
            <FileInput
              className="upload-button"
              label={
                <>
                  <i className="icon upload" />
                  Upload Images
                </>
              }
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              data-test-id="image-modal-file-upload"
            />
            <Button 
              onClick={handleClearStorage} 
              className="instagram-button" 
              style={{marginTop: '8px'}}
            >
              Clear All Assets
            </Button>
            <Button 
              onClick={useAssetStore.getState().cleanupOrphanedAssets} 
              className="instagram-button" 
              style={{marginTop: '8px'}}
            >
              Clean Up Orphaned Assets
            </Button>
          </div>

          <div className="asset-grid">
            {currentFolder.children
              .filter((item) => !('children' in item))
              .map((item) => (
                <AssetGridItem
                  key={item.id}
                  item={item as Asset}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={onClose} className="action-button cancel-button">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
