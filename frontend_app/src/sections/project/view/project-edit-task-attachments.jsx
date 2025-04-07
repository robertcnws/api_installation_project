import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Grid, Button } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';


export function ProjectEditTaskAttachments({
  project,
  refetchProject,
  task,
  setTask,
  newFiles,
  setNewFiles,
  id,
  name,
  type,
  isMobile,
  listPermissions,
}) {
  const [initialFiles, setInitialFiles] = useState([]);
  const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);
  const [fileToRemove, setFileToRemove] = useState(null);
  const confirm = useBoolean();
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  useEffect(() => {
    const attachments = task?.project_task_attachments || [];
    if (!attachments.length) {
      setInitialFiles([]);
      return;
    }
    const loadFiles = async () => {
      const loaded = await Promise.all(
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
      setInitialFiles(loaded);
    };
    loadFiles();
  }, [task?.project_task_attachments]);

  const handleClickRemoveFile = (file) => {
    setFileToRemove(file);
    confirm.onTrue();
  };

  const handleConfirmRemove = useCallback(
    async () => {
      if (!fileToRemove) return;
      let updatedInitial = initialFiles;
      let updatedNew = newFiles;
      const isLocalFile = fileToRemove instanceof File;
      if (!fileToRemove.isNew && !isLocalFile) {
        try {
          const taskId = task?.project_default_task.id;
          await axios.delete(`${CONFIG.apiUrl}/projects/delete/file/${id}/project/${taskId}/task/${fileToRemove.file}/`, {
            data: {
              userReporter: userLogged?.data,
            },
          });
          updatedInitial = initialFiles.filter((f) => f.file !== fileToRemove.file);
          toast.success('File deleted successfully');
        } catch (error) {
          console.error('Error deleting file', error);
          toast.error('Error deleting file');
          return;
        }
      } else {
        updatedNew = newFiles.filter((f) => f.name !== fileToRemove.name);
      }
      setInitialFiles(updatedInitial);
      setNewFiles(updatedNew);

      confirm.onFalse();
      setFileToRemove(null);
      await refetchProject?.();
      setTask((prev) => {
        const updatedTask = { ...prev };
        updatedTask.project_task_attachments = project?.projectDefaultTasks?.find(
          (t) => t.project_default_task.id === task.project_default_task.id
        ).project_task_attachments;
        return updatedTask;
      });

    }, [fileToRemove, initialFiles, newFiles, setNewFiles, project, id, userLogged, refetchProject, setTask, task, confirm]);

  const handleAddFiles = useCallback(
    async () => {
      if (newFiles.length === 0) return;
      try {
        const formData = new FormData();

        const filePromises = newFiles.map(async (file) => {
          if (file instanceof File) {
            return file;
          }
          if (file.fileUrl) {
            const response = await fetch(file.fileUrl);
            const blob = await response.blob();
            return new File([blob], file.name, { type: blob.type });
          }
          return null;
        });

        const filesToUpload = (await Promise.all(filePromises)).filter((f) => f !== null);

        filesToUpload.forEach((file) => {
          formData.append('projectTaskAttachments', file);
        });
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const taskId = task.project_default_task.id;

        const response = await axios.post(`${CONFIG.apiUrl}/projects/upload/project/${id}/task/${taskId}/file/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status !== 201) {
          console.error('Error uploading new default task files', response.statusText);
          toast.error('Error uploading new default task files');
          return;
        }
        const respRefetch = await refetchProject?.();

        const updatedProject = respRefetch?.data?.projectById;

        if (updatedProject) {
          const updated = updatedProject?.projectDefaultTasks.find(
            (t) => t.project_default_task.id === task.project_default_task.id
          );
          console.log('updatedTask', updated);
          setTask((prev) => {
            const updatedTask = { ...prev };
            updatedTask.project_task_attachments = updatedProject?.projectDefaultTasks.find(
              (t) => t.project_default_task.id === task.project_default_task.id
            ).project_task_attachments;
            return updatedTask;
          });
          setNewFiles([]);
          toast.success('Default Task Files uploaded successfully');
        }
      } catch (error) {
        console.error('Error uploading new default task files', error);
        toast.error('Error uploading new default task files');
      }
    }, [newFiles, setNewFiles, task, id, userLogged, refetchProject, setTask]);

  const handleDownloadFile = (file) => {
    if (!file || !file.fileUrl) return;

    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.name;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAddFilesEnabled = newFiles.length > 0;

  return (
    <>
      <Box sx={{ maxHeight: 550, minHeight: !isMobile ? 400 : 0, overflow: 'auto' }}>
        {project?.currentStage && (
          <Box
            key={project?.currentStage?.id}
            sx={{ mb: 3, display: 'flex', gap: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={4} sm={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 1, width: '100%' }}>
                    {(verifyPermissions(
                      listPermissions,
                      CONFIG.permissions.system,
                      CONFIG.permissions.moduleTasks,
                      CONFIG.permissions.operationUploadFile
                    ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                        <Button
                          color="primary"
                          variant="outlined"
                          disabled={!isAddFilesEnabled}
                          onClick={handleAddFiles}
                        >
                          <Iconify icon="material-symbols:attach-file-add" />
                          Add File(s)
                        </Button>
                      )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={8} sm={8}>
                <MultiFilePreview
                  key={project?.currentStage?.id}
                  thumbnail
                  files={displayFiles || []}
                  onRemove={handleClickRemoveFile}
                  onDownload={handleDownloadFile}
                  // slotProps={{
                  //   thumbnail: {
                  //     sx: {
                  //       width: 75,
                  //       height: 75,
                  //       cursor: 'pointer',
                  //       position: 'relative',
                  //       transition: 'background-color 0.3s ease',
                  //       '&:hover': {
                  //         bgcolor: 'rgba(0, 0, 0, 0.1)',
                  //         opacity: 0.5,
                  //       },
                  //       '&::after': {
                  //         content: '""',
                  //         position: 'absolute',
                  //         bottom: 4,
                  //         right: 12,
                  //         width: 40,
                  //         height: 40,
                  //         backgroundImage: 'url(/assets/icons/apps/ic-download-1.svg)',
                  //         backgroundSize: 'contain',
                  //         backgroundRepeat: 'no-repeat',
                  //         display: 'none',
                  //       },
                  //       '&:hover::after': {
                  //         display: 'block',
                  //       },
                  //     },
                  //   }
                  // }}
                  lastNode={
                    (verifyPermissions(
                      listPermissions,
                      CONFIG.permissions.system,
                      CONFIG.permissions.moduleTasks,
                      CONFIG.permissions.operationUploadFile
                    ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                      <UploadBox sx={{ ml: displayFiles.length === 0 ? 2 : 0, width: 75, height: 75 }} onDrop={(files) => {
                        if (files && files.length) {
                          const uniqueFiles = files.filter((file) =>
                            !displayFiles.some((existingFile) => existingFile.name === file.name)
                          );
                          if (uniqueFiles.length > 0) {
                            const filesToAdd = uniqueFiles.map((file) => ({
                              ...file,
                              fileUrl: URL.createObjectURL(file),
                              name: file.name,
                              isNew: true,
                            }));
                            setNewFiles((prev) => [...prev, ...filesToAdd]);
                          }
                          else {
                            toast.error('File already exists');
                          }
                        }
                      }} />
                    ) : <Box sx={{ ml: displayFiles.length === 0 ? 2 : 0, width: 75, height: 75 }} />
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

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
              <>
                Are you sure you want to delete the file{' '}
                <strong>{fileToRemove.name}</strong> from{' '}
                <strong>
                  {type} ({task.project_default_task.name}) in {name}
                </strong>
                ?
              </>
            )}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmRemove}>
            Remove
          </Button>
        }
      />
    </>
  );
}
