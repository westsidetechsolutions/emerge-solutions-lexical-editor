/* eslint-disable */
// @ts-nocheck

import React, {useState, useEffect} from 'react';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import './AssetManager.css';

interface Asset {
  id: string;
  name: string;
  url: string;
}

interface Folder {
  id: string;
  name: string;
  children: Array<Folder | Asset>;
  isExpanded?: boolean;
}

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
}

const initialTree: Folder = {
  id: 'root',
  name: 'Root',
  children: [],
};

const FolderTreeItem = ({
  folder,
  level = 0,
  selectedFolderId,
  onFolderSelect,
  onFolderToggle,
  onFolderRename,
}: {
  folder: Folder;
  level?: number;
  selectedFolderId: string;
  onFolderSelect: (folder: Folder) => void;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
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
          <TextInput
            value={newName}
            onChange={(value) => setNewName(value)}
            onBlur={() => {
              onFolderRename(folder.id, newName);
              setIsRenaming(false);
            }}
            data-test-id={`rename-folder-${folder.id}`}
          />
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
  return (
    <div className="asset-item">
      <img src={item.url} alt={item.name} />
      <div className="asset-item-overlay">
        <div className="asset-item-name">{item.name}</div>
        <button className="instagram-button" onClick={() => onSelect(item)}>
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
  const [tree, setTree] = useState<Folder>(initialTree);
  const [currentFolder, setCurrentFolder] = useState<Folder>(initialTree);
  const [newFolderName, setNewFolderName] = useState('');

  // Load tree from localStorage on component mount
  useEffect(() => {
    try {
      const storedTree = localStorage.getItem('assetManagerTree');
      if (storedTree) {
        const parsedTree = JSON.parse(storedTree);
        setTree(parsedTree);
        setCurrentFolder(parsedTree);
      } else {
        localStorage.setItem('assetManagerTree', JSON.stringify(initialTree));
      }
    } catch (error) {
      console.error('Error loading asset manager tree:', error);
      localStorage.setItem('assetManagerTree', JSON.stringify(initialTree));
    }
  }, []);

  // Save tree to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('assetManagerTree', JSON.stringify(tree));
    } catch (error) {
      console.error('Error saving asset manager tree:', error);
    }
  }, [tree]);

  const addFolder = () => {
    if (newFolderName.trim() === '') return;

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      children: [],
      isExpanded: false,
    };

    const addFolderRecursively = (parentFolder: Folder): Folder => {
      if (parentFolder.id === currentFolder.id) {
        return {
          ...parentFolder,
          children: [...parentFolder.children, newFolder],
        };
      }
      return {
        ...parentFolder,
        children: parentFolder.children.map((child) =>
          'children' in child ? addFolderRecursively(child) : child,
        ),
      };
    };

    setTree(addFolderRecursively(tree));
    setCurrentFolder((prev) => ({
      ...prev,
      children: [...prev.children, newFolder],
    }));
    setNewFolderName('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const processFile = async (file: File): Promise<Asset> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            url: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      });
    };

    const newAssets = await Promise.all(Array.from(files).map(processFile));

    const updatedFolder = {
      ...currentFolder,
      children: [...currentFolder.children, ...newAssets],
    };

    const updateTreeRecursively = (folder: Folder): Folder => {
      if (folder.id === currentFolder.id) {
        return updatedFolder;
      }
      return {
        ...folder,
        children: folder.children.map((child) =>
          'children' in child ? updateTreeRecursively(child) : child,
        ),
      };
    };

    const newTree = updateTreeRecursively(tree);
    setTree(newTree);
    setCurrentFolder(updatedFolder);
  };

  const toggleFolder = (folderId: string) => {
    const toggleFolderRecursively = (folder: Folder): Folder => {
      if (folder.id === folderId) {
        return {...folder, isExpanded: !folder.isExpanded};
      }
      return {
        ...folder,
        children: folder.children.map((child) =>
          'children' in child ? toggleFolderRecursively(child) : child,
        ),
      };
    };
    setTree(toggleFolderRecursively(tree));
  };

  const renameFolder = (folderId: string, newName: string) => {
    if (newName.trim() === '') return;

    const renameFolderRecursively = (folder: Folder): Folder => {
      if (folder.id === folderId) {
        return {...folder, name: newName.trim()};
      }
      return {
        ...folder,
        children: folder.children.map((child) =>
          'children' in child ? renameFolderRecursively(child) : child,
        ),
      };
    };
    setTree(renameFolderRecursively(tree));
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
            <Button onClick={addFolder} className="instagram-button">
              Create Folder
            </Button>
          </div>

          <FolderTreeItem
            folder={tree}
            selectedFolderId={currentFolder.id}
            onFolderSelect={setCurrentFolder}
            onFolderToggle={toggleFolder}
            onFolderRename={renameFolder}
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
