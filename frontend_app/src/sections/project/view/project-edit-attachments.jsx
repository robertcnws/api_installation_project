import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Grid, Paper, Button, Divider } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';


export function ProjectEditAttachments({
  project,
  refetchProject,
  id,
  name,
  type,
  loadedStages,
  isMobile,
  listPermissions,
}) {
  const [initialFiles, setInitialFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);

  const [currentUploadStageId, setCurrentUploadStageId] = useState(null);

  const mappedDisplayFiles = useMemo(() => {
    if (!loadedStages || !project || !project.currentStage) return [];
    return loadedStages?.map((stage) => {
      const filesForStage = displayFiles.filter((file) =>
        file.isNew ? file?.stageId === stage.id : file?.current_stage && file?.current_stage?.id === stage.id
      );
      return {
        stageName: stage.name,
        stageId: stage.id,
        files: filesForStage,
      };
    });
  }, [displayFiles, loadedStages, project]);


  const [fileToRemove, setFileToRemove] = useState(null);
  const confirm = useBoolean();
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const someNewFileFromAnotherStage = useCallback((stageId) =>
    newFiles.some((file) => file.stageId !== stageId && file.isNew), [newFiles]
  );

  useEffect(() => {
    const tasks = project?.projectDefaultTasks
    const taskAttachments = tasks?.map((task) =>
      task?.project_task_attachments.map((attachment) => ({
        ...attachment,
        current_stage: attachment?.due_project_stage,
        task_id: task?.project_default_task?.id,
      }))).flat();

    const projectAttachments = project.projectAttachments || [];

    const attachments = [...projectAttachments, ...taskAttachments] || [];

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
  }, [project]);

  const handleClickRemoveFile = (file) => {
    setFileToRemove(file);
    confirm.onTrue();
  };

  const handleConfirmRemove = async () => {
    if (!fileToRemove) return;
    let updatedInitial = initialFiles;
    let updatedNew = newFiles;
    const isLocalFile = fileToRemove instanceof File;
    if (!fileToRemove.isNew && !isLocalFile) {
      try {
        const url = fileToRemove.file.indexOf('tasks/') !== -1
          ? `${CONFIG.apiUrl}/projects/delete/file/${id}/project/${fileToRemove.task_id}/task/${fileToRemove.file}/`
          : `${CONFIG.apiUrl}/projects/delete/file/${id}/project/${fileToRemove.file}/`;
        await axios.delete(url, {
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
    refetchProject?.();
  };

  const handleAddFiles = async (stageId = null) => {
    if (newFiles.length === 0) return;
    try {
      const formData = new FormData();

      const actualStageId = stageId || project?.currentStage?.id;

      const filePromises = newFiles.filter((f) => f.stageId === actualStageId).map(async (file) => {
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
        formData.append('projectAttachments', file);
      });
      formData.append('userReporter', JSON.stringify(userLogged?.data));

      if (stageId) {
        const stage = loadedStages.find((s) => s.id === stageId);
        if (stage) {
          formData.append('projectStage', JSON.stringify(stage));
        }
      }

      await axios.post(`${CONFIG.apiUrl}/projects/upload/project/${id}/file/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNewFiles([]);
      refetchProject?.();
      toast.success('New files uploaded successfully');
    } catch (error) {
      console.error('Error uploading new files', error);
      toast.error('Error uploading new files');
    }
  };

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

  const isAddFilesEnabled = (stageId) => newFiles.filter((f) => f.stageId === stageId).length > 0;

  return (
    <>
      <Box sx={{ maxHeight: 600, minHeight: !isMobile ? 600 : 0, overflow: 'auto' }}>
        {(project?.currentStage &&
          project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1) && (
            <>
              <Box
                key={project?.currentStage?.id}
                sx={{ mb: 3, display: 'flex', gap: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={4} sm={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ mb: 1, typography: 'overline' }}>
                        <b>{project?.currentStage?.name}</b>
                      </Box>
                      {((verifyPermissions(
                        listPermissions,
                        CONFIG.permissions.system,
                        CONFIG.permissions.moduleProjects,
                        CONFIG.permissions.operationUploadFile
                      ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) &&
                        !someNewFileFromAnotherStage(project?.currentStage?.id)
                      ) && (
                          <Box sx={{ mb: 1 }}>
                            <Button
                              color="primary"
                              variant="outlined"
                              disabled={!isAddFilesEnabled(project?.currentStage?.id)}
                              onClick={() => handleAddFiles(project?.currentStage?.id)}
                            >
                              <Iconify icon="material-symbols:attach-file-add" />
                              Add File(s)
                            </Button>
                          </Box>
                        )}
                    </Box>
                  </Grid>
                  <Grid item xs={8} sm={10}>
                    <MultiFilePreview
                      key={project?.currentStage?.id}
                      thumbnail
                      files={mappedDisplayFiles.find(
                        (mappedFile) => mappedFile.stageId === project?.currentStage?.id)?.files || []
                      }
                      onRemove={handleClickRemoveFile}
                      onDownload={handleDownloadFile}
                      lastNode={
                        ((verifyPermissions(
                          listPermissions,
                          CONFIG.permissions.system,
                          CONFIG.permissions.moduleProjects,
                          CONFIG.permissions.operationUploadFile
                        ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) &&
                          !someNewFileFromAnotherStage(project?.currentStage?.id)) ? (
                          <UploadBox onDrop={(files) => {
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
                                  stageId: project?.currentStage?.id,
                                }));
                                setNewFiles((prev) => [...prev, ...filesToAdd]);
                              }
                              else {
                                toast.error('File already exists');
                              }
                            }
                          }} />
                        ) : null
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            </>
          )}
        {(project && loadedStages && loadedStages.length > 0) && (
          <Box
            gap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            {mappedDisplayFiles
              .filter((mappedFile) => mappedFile.stageId !== project?.currentStage?.id)
              .map((mappedFile) => (
                <Paper
                  key={mappedFile.stageId}
                  variant="outlined"
                  sx={{
                    gap: 1,
                    p: 2.5,
                    width: '100%',
                    minHeight: !isMobile ? newFiles.length === 0 ? 240 : 235 : 0,
                    display: 'flex',
                    borderRadius: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: 'background.neutral',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 1, typography: 'overline' }}>{mappedFile.stageName}</Box>
                    <MultiFilePreview
                      key={mappedFile.stageId}
                      thumbnail
                      // files={[...mappedFile.files, ...newFiles.filter((f) => f.stageId === mappedFile.stageId)]}
                      files={mappedFile.files}
                      onRemove={handleClickRemoveFile}
                      onDownload={handleDownloadFile}
                      lastNode={
                        ((verifyPermissions(
                          listPermissions,
                          CONFIG.permissions.system,
                          CONFIG.permissions.moduleProjects,
                          CONFIG.permissions.operationUploadFile
                        ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) &&
                          !someNewFileFromAnotherStage(mappedFile.stageId)) ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <UploadBox onDrop={(files) => {
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
                                    stageId: mappedFile.stageId,
                                  }));
                                  setNewFiles((prev) => [...prev, ...filesToAdd]);
                                }
                                else {
                                  toast.error('File already exists');
                                }
                              }
                            }} />
                            {!someNewFileFromAnotherStage(mappedFile.stageId) && (
                              <Button
                                color="primary"
                                variant="outlined"
                                disabled={!isAddFilesEnabled(mappedFile.stageId)}
                                onClick={() => handleAddFiles(mappedFile.stageId)}
                                sx={{ p: 0, mt: 1 }}
                              >
                                <Iconify icon="material-symbols:attach-file-add" />
                                Add
                              </Button>
                            )}
                          </Box>
                        ) : null
                      }
                    />
                  </Box>
                </Paper>
              ))}
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
                  {type} {name}
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
