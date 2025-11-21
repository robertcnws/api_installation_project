import axios from 'axios';
import { useMemo, useState, useCallback } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Dialog, DialogActions } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar'
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ServiceDetailsContentOverview } from './service-details-content-overview';


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ServiceNewFormFromProject({
  salesOrder,
  open,
  setOpen,
}) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [someItemsSelected, setSomeItemsSelected] = useState(false);

  const [allIssuesCompleted, setAllIssuesCompleted] = useState(false);

  const [isSubmiting, setIsSubmiting] = useState(false);

  const [selectedListItems, setSelectedListItems] = useState([]);

  const [serviceType, setServiceType] = useState(null);

  const [serviceFiles, setServiceFiles] = useState([]);

  const [serviceNotes, setServiceNotes] = useState(null);

  const [fileToRemove, setFileToRemove] = useState(null);

  const [serviceAddress, setServiceAddress] = useState('');

  const [servicePlace, setServicePlace] = useState('');

  const [serviceBooleanValues, setServiceBooleanValues] = useState({
    hasToPay: false,
    byFactory: false,
  });

  const confirm = useBoolean();


  const handleCreateService = useCallback(async () => {
    setIsSubmiting(true);

    const formData = new FormData();

    const filePromises = serviceFiles.map(async (file) => {
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
      formData.append('serviceAttachments', file);
    });

    formData.append('notes', serviceNotes || '');
    formData.append('serviceType', serviceType || '');
    formData.append('salesOrder', JSON.stringify(salesOrder) || '');
    formData.append('userReporter', JSON.stringify(userLogged?.data) || '');
    formData.append('issuedProducts', JSON.stringify(selectedListItems.filter((item) => item.selected)) || '');
    formData.append('address', serviceAddress || '');
    formData.append('hasToPay', serviceBooleanValues.hasToPay || false);
    formData.append('byFactory', serviceBooleanValues.byFactory || false);
    formData.append('servicePlace', JSON.stringify(servicePlace) || '');

    try {
      const promise = axios.post(`${CONFIG.apiUrl}/services/create/service/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.promise(promise, {
        loading: 'Creating service...',
        success: 'Service created!',
        error: 'Error to create service',
      });

      await promise;

      setIsSubmiting(false);

      setServiceFiles([]);
      setServiceNotes(null);

      setOpen(false);

      router.push(paths.dashboard.service.list);

    } catch (error) {
      setIsSubmiting(false);
      console.error(error);
    }
  }, [
    salesOrder, 
    selectedListItems, 
    userLogged, 
    router, 
    serviceType, 
    serviceFiles, 
    serviceNotes, 
    serviceAddress,
    serviceBooleanValues,
    servicePlace,
    setOpen
  ]);


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

  const handleClickRemoveFile = (file) => {
    setFileToRemove(file);
    confirm.onTrue();
  };

  const handleConfirmRemove = async () => {
    if (!fileToRemove) return;
    let updatedNew = [];

    updatedNew = serviceFiles.filter((f) => f.name !== fileToRemove.name);
    setServiceFiles(updatedNew);

    confirm.onFalse();
    setFileToRemove(null);
  };

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <Scrollbar style={{ height: '70%' }}>
          <ServiceDetailsContentOverview
            salesOrder={salesOrder}
            setSomeItemsSelected={setSomeItemsSelected}
            setAllIssuesCompleted={setAllIssuesCompleted}
            selectedListItems={selectedListItems}
            setSelectedListItems={setSelectedListItems}
            setServiceType={setServiceType}
            serviceFiles={serviceFiles}
            setServiceFiles={setServiceFiles}
            serviceNotes={serviceNotes}
            setServiceNotes={setServiceNotes}
            serviceBooleanValues={serviceBooleanValues}
            setServiceBooleanValues={setServiceBooleanValues}
            serviceAddress={serviceAddress}
            setServiceAddress={setServiceAddress}
            servicePlace={servicePlace}
            setServicePlace={setServicePlace}
            handleDownloadFile={handleDownloadFile}
            handleClickRemoveFile={handleClickRemoveFile}
          />
        </Scrollbar>
        <DialogActions>
          <LoadingButton
            loading={isSubmiting}
            variant="contained"
            disabled={!someItemsSelected || !allIssuesCompleted}
            onClick={handleCreateService}
          >
            Create Service
          </LoadingButton>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
                <strong>{fileToRemove.name}</strong> from the service{' '}?
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