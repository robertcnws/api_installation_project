import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';

import { ProjectFolderItem } from './project-folder-item';
import { ProjectShareDialog } from './project-share-dialog';
import { ProjectActionSelected } from './project-action-selected';
import { ProjectNewFolderDialog } from './project-new-folder-dialog';

// ----------------------------------------------------------------------

export function ProjectGridView({ 
  table, 
  dataFiltered, 
  onDeleteItem, 
  onViewRow,
  onOpenConfirm,
  loadedUsers, 
  loadedProjectPermissions,
  loadedStages,
  loadedStagesTask,
  setTableData,
  refetchProjects,
}) {
  const { selected, onSelectRow: onSelectItem, onSelectAllRows: onSelectAllItems } = table;

  const share = useBoolean();

  const files = useBoolean();

  const upload = useBoolean();

  const folders = useBoolean();

  const newFolder = useBoolean();

  const containerRef = useRef(null);

  const [folderName, setFolderName] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');

  const handleChangeInvite = useCallback((event) => {
    setInviteEmail(event.target.value);
  }, []);

  const handleChangeFolderName = useCallback((event) => {
    setFolderName(event.target.value);
  }, []);

  return (
    <>
      <Box ref={containerRef}>
        {/* <ProjectPanel
          title="Folders"
          subtitle={`${dataFiltered.filter((item) => item.type === 'folder').length} folders`}
          onOpen={newFolder.onTrue}
          collapse={folders.value}
          onCollapse={folders.onToggle}
        /> */}

        <Collapse in={!folders.value} unmountOnExit>
          <Box
            gap={3}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
          >
            {dataFiltered
              .filter((i) => i.type === 'folder')
              .map((folder) => (
                <ProjectFolderItem
                  key={folder.id}
                  folder={folder}
                  selected={selected.includes(folder.id)}
                  onSelect={() => onSelectItem(folder.id)}
                  onDelete={() => onDeleteItem(folder.id)}
                  onViewRow={() => onViewRow(folder.id)}
                  loadedUsers={loadedUsers}
                  loadedProjectPermissions={loadedProjectPermissions}
                  loadedStages={loadedStages}
                  loadedStagesTask={loadedStagesTask}
                  setTableData={setTableData}
                  refetchProjects={refetchProjects}
                  sx={{ maxWidth: 'auto' }}
                />
              ))}
          </Box>
        </Collapse>

        <Divider sx={{ my: 5, borderStyle: 'dashed' }} />

        {/* <ProjectPanel
          title="Files"
          subtitle={`${dataFiltered.filter((item) => item.type !== 'folder').length} files`}
          onOpen={upload.onTrue}
          collapse={files.value}
          onCollapse={files.onToggle}
        />

        <Collapse in={!files.value} unmountOnExit>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={3}
          >
            {dataFiltered
              .filter((i) => i.type !== 'folder')
              .map((file) => (
                <ProjectFileItem
                  key={file.id}
                  file={file}
                  selected={selected.includes(file.id)}
                  onSelect={() => onSelectItem(file.id)}
                  onDelete={() => onDeleteItem(file.id)}
                  sx={{ maxWidth: 'auto' }}
                />
              ))}
          </Box>
        </Collapse> */}

        {!!selected?.length && (
          <ProjectActionSelected
            numSelected={selected.length}
            rowCount={dataFiltered.length}
            selected={selected}
            onSelectAllItems={(checked) =>
              onSelectAllItems(
                checked,
                dataFiltered.map((row) => row.id)
              )
            }
            action={
              <>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={onOpenConfirm}
                  sx={{ mr: 1 }}
                >
                  Delete
                </Button>

                <Button
                  color="primary"
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="solar:share-bold" />}
                  onClick={share.onTrue}
                >
                  Share
                </Button>
              </>
            }
          />
        )}
      </Box>

      <ProjectShareDialog
        open={share.value}
        inviteEmail={inviteEmail}
        onChangeInvite={handleChangeInvite}
        onClose={() => {
          share.onFalse();
          setInviteEmail('');
        }}
      />

      <ProjectNewFolderDialog open={upload.value} onClose={upload.onFalse} />

      <ProjectNewFolderDialog
        open={newFolder.value}
        onClose={newFolder.onFalse}
        title="New Folder"
        onCreate={() => {
          newFolder.onFalse();
          setFolderName('');
          console.info('CREATE NEW FOLDER', folderName);
        }}
        folderName={folderName}
        onChangeFolderName={handleChangeFolderName}
      />
    </>
  );
}
