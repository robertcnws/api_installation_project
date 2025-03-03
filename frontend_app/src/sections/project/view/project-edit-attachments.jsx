import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import { Box, Grid, Paper, Button, Divider } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';
import { listRolesAndSubroles, verifyPermissions } from 'src/utils/check-permissions';


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

  const mappedDisplayFiles = useMemo(() => {
    if (!loadedStages || !project || !project.currentStage) return [];
    return loadedStages?.map((stage) => {
      const filesForStage = displayFiles.filter((file) =>
        file.isNew ? project.currentStage.id === stage.id : file.current_stage && file.current_stage.id === stage.id
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

  useEffect(() => {
    const attachments = project.projectAttachments || [];
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
        await axios.delete(`${CONFIG.apiUrl}/projects/delete/file/${id}/project/${fileToRemove.file}/`, {
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

  const handleAddFiles = async () => {
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
        formData.append('projectAttachments', file);
      });
      formData.append('userReporter', JSON.stringify(userLogged?.data));

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

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAddFilesEnabled = newFiles.length > 0;

  return (
    <>
      <Box sx={{ maxHeight: 550, minHeight: !isMobile ? 500 : 0, overflow: 'auto' }}>
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
                      {(verifyPermissions(
                        listPermissions,
                        CONFIG.permissions.system,
                        CONFIG.permissions.moduleProjects,
                        CONFIG.permissions.operationUploadFile
                      ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                          <Box sx={{ mb: 1 }}>
                            <Button
                              color="primary"
                              variant="outlined"
                              disabled={!isAddFilesEnabled}
                              onClick={handleAddFiles}
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
                      files={mappedDisplayFiles.find((mappedFile) => mappedFile.stageId === project?.currentStage?.id)?.files || []}
                      onRemove={handleClickRemoveFile}
                      onDownload={handleDownloadFile}
                      // slotProps={{
                      //   thumbnail: {
                      //     sx: {
                      //       width: 64,
                      //       height: 64,
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
                          CONFIG.permissions.moduleProjects,
                          CONFIG.permissions.operationUploadFile
                        ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
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
                    minHeight: !isMobile ? 200 : 0,
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
                      files={mappedFile.files}
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
                      //         right: 17,
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
                      lastNode={null}
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
