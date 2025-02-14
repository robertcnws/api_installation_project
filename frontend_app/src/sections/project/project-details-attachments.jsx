import axios from 'axios';

import { Button } from '@mui/material';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { UploadBox, MultiFilePreview } from 'src/components/upload';

import { CONFIG } from 'src/config-global';

import { useBoolean } from 'src/hooks/use-boolean';

// ----------------------------------------------------------------------

export function ProjectDetailsAttachments({
  projectData,
  setProjectData,
  setTableData,
  refetchProjects,
  attachments,
  id,
  onChange,
  name,
  type,
}) {
  const [displayFiles, setDisplayFiles] = useState([]);
  const [fileToRemove, setFileToRemove] = useState(null);

  const confirm = useBoolean();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const handleClickRemoveFile = (file) => {
    setFileToRemove(file);
    confirm.onTrue();
  };

  useEffect(() => {
    if (!attachments || attachments.length === 0) {
      setDisplayFiles([]);
      return;
    }
    const loadFiles = async () => {
      const newFiles = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment instanceof File) {
            return {
              ...attachment,
              fileUrl: URL.createObjectURL(attachment),
              name: attachment.name,
              isNew: true,
            };
          }
          if (!attachment.file) {
            return attachment;
          }
          try {
            const response = await fetch(
              `${CONFIG.apiUrl}/projects/get-file-url/?key=${encodeURIComponent(attachment.file)}`
            );
            if (!response.ok) {
              console.error('Error fetching URL', response.statusText);
              return attachment;
            }
            const values = await response.json();
            return {
              ...attachment,
              fileUrl: values.url,
              isNew: false,
            };
          } catch (error) {
            console.error('Error al obtener la URL:', error);
            return attachment;
          }
        })
      );
      setDisplayFiles(newFiles);
    };
    loadFiles();
  }, [attachments]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      onChange?.([...attachments, ...acceptedFiles]);
    },
    [attachments, onChange]
  );

  const handleConfirmRemove = async () => {
    if (!fileToRemove) return;

    let filtered = [];

    if (!fileToRemove.isNew) {
      try {
        await axios.delete(`${CONFIG.apiUrl}/projects/delete/file/${id}/${fileToRemove.file}/`, {
          data: {
            userReporter: userLogged?.data,
          },
        });
        filtered = attachments.filter((f) => f.file !== fileToRemove.file);
      } catch (error) {
        console.error('Error deleting file', error);
        return;
      }
    }
    else{
      filtered = attachments.filter((f) => f.name !== fileToRemove.name);
    }

    onChange?.(filtered);

    confirm.onFalse();
    setFileToRemove(null);
    refetchProjects?.();
    if (type === 'project') {
      setProjectData({
        ...projectData,
        projectAttachments: filtered,
      });
      setTableData((prev) => prev.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            projectAttachments: filtered,
          };
        }
        return row;
      }));
    }
    else if (type === 'task') {
      setProjectData({
        ...projectData,
        projectTasks: projectData.projectTasks.map((task) => {
          if (task.id === id) {
            return {
              ...task,
              project_task_attachments: filtered,
            };
          }
          return task;
        }),
      });
      setTableData((prev) => prev.map((row) => {
        row.projectTasks = row.projectTasks.map((task) => {
          if (task.id === id) {
            return {
              ...task,
              project_task_attachments: filtered,
            };
          }
          return task;
        });
        return row;
      }));
    }
  };

  return (
    <>
      <MultiFilePreview
        thumbnail
        files={displayFiles}
        onRemove={handleClickRemoveFile}
        slotProps={{ thumbnail: { sx: { width: 64, height: 64 } } }}
        lastNode={<UploadBox onDrop={handleDrop} />}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={() => {
          confirm.onFalse();
          setFileToRemove(null);
        }}
        title="Remove File"
        content={
          <>
            {fileToRemove && (
              <>Are you sure you want to delete the file <strong>{fileToRemove.name}</strong> from <strong>{type} ({name})</strong>?</>
            )}
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRemove}
          >
            Remove
          </Button>
        }
      />
    </>
  );
}