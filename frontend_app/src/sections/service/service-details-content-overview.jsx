import { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Radio, TextField, RadioGroup, FormControlLabel, Switch, ListItem, Chip, Autocomplete } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { UploadBox, MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ServiceDetailsContentOverviewTableIssues } from './service-details-content-overview-table-issues';
import { ServiceDetailsContentOverviewModalService } from './service-details-content-overview-modal-service';
import { ServiceDetailsContentOverviewTableIssuesMobile } from './service-details-content-overview-table-issues-mobile';
import { SERVICE_PLACE_OPTIONS } from './view/service-details-content';




// ----------------------------------------------------------------------

export function ServiceDetailsContentOverview({
  salesOrder,
  setSomeItemsSelected,
  setAllIssuesCompleted,
  selectedListItems,
  setSelectedListItems,
  service = null,
  setServiceType,
  serviceFiles,
  setServiceFiles,
  serviceNotes,
  setServiceNotes,
  serviceAddress,
  setServiceAddress,
  serviceBooleanValues,
  setServiceBooleanValues,
  servicePlace,
  setServicePlace,
  handleClickRemoveFile,
  handleDownloadFile,
}) {

  const {
    loadedServiceIssues
  } = useDataContext();

  const containerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const items = useMemo(() =>
    service ?
      salesOrder?.line_items.filter(
        (item) => !service?.issuedProducts.some((issuedProduct) => issuedProduct.line_item_id === item.line_item_id)
      ) :
      salesOrder?.line_items,
    [salesOrder, service]);

  const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

  const serviceItems = useMemo(() => items?.filter((product) => product.line_item_type !== 'goods'), [items]);

  const [localServiceType, setLocalServiceType] = useState(service?.serviceType || 'retail');

  useEffect(() => {
    setLocalServiceType(service ? service?.serviceType : 'retail');
    setServiceType(service ? service?.serviceType : 'retail');
  }, [service, setServiceType]);

  const handleServiceTypeChange = (e) => {
    setLocalServiceType(e.target.value);
    setServiceType(e.target.value);
  };

  useEffect(() => {
    setSelectedListItems(
      listItems?.map((product) => ({
        ...product,
        selected: false,
        issues: [],
        notes: '',
      })) || []
    );
  }, [listItems, setSelectedListItems]);

  const addIssue = (product) => {
    const lastIndex = product.issues.length;
    setSelectedListItems((prev) =>
      prev.map((item) =>
        item.line_item_id === product.line_item_id
          ? {
            ...item, issues: [...item.issues, {
              id: lastIndex + 1,
              issue: null,
              quantity: 1,
              color: 'error.main',
              notes: '',
              created_time: new Date().toISOString(),
              last_modified_time: new Date().toISOString(),
            }]
          }
          : item
      )
    );
  };

  const removeIssue = (product, issue) => {
    setSelectedListItems((prev) =>
      prev.map((item) =>
        item.line_item_id === product.line_item_id
          ? {
            ...item, issues: item.issues.filter((i) => i.id !== issue.id)
          }
          : item
      )
    );
  };

  const canAddIssue = useCallback((product) => {
    if (!product) return false;
    const emptyIssues = product.issues ? product.issues.filter(issue => !issue.issue || issue.quantity < 1) : [];
    return emptyIssues.length === 0;
  }, []);

  const changeQuantity = (product, issue, operation) => {
    let newQuantity = 0;
    if (operation === 'add') {
      newQuantity = product.quantity >= Number(issue.quantity) + 1 ? Number(issue.quantity) + 1 : Number(issue.quantity);
    } else {
      newQuantity = Number(issue.quantity) - 1 < 1 ? 1 : Number(issue.quantity) - 1;
    }
    setSelectedListItems((prev) =>
      prev.map((item) =>
        item.line_item_id === product.line_item_id
          ? {
            ...item, issues: item.issues.map((i) =>
              i.id === issue.id
                ? {
                  ...i,
                  quantity: newQuantity
                }
                : i
            )
          }
          : item
      )
    );
  }

  useEffect(() => {
    setSomeItemsSelected(selectedListItems?.some((product) => product.selected));
    setAllIssuesCompleted(selectedListItems?.every(canAddIssue));
  }, [selectedListItems, setSomeItemsSelected, setAllIssuesCompleted, canAddIssue]);

  const openServiceItems = useBoolean(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight);
    }
  }, []);

  if (salesOrder === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Service not found!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{
        p: 3,
        gap: 3,
        display: 'flex',
        flexDirection: !isMobile ? 'row' : 'column',
        ml: 0,
        overflow: 'auto'
      }}>
        {[
          service && {
            label: 'Service',
            value: service?.name,
            icon: <Iconify
              icon="fluent-mdl2:service-off"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.name?.length > 0,
          },
          ...salesOrder?.salesorder_number?.length > 0 ? [
            {
              label: 'SO Number',
              value: salesOrder?.salesorder_number,
              icon: <Iconify
                icon="fluent:book-number-24-regular"
                sx={{ color: 'text.primary' }}
              />,
              hasValue: salesOrder?.salesorder_number?.length > 0,
            },
          ] : [],
          ...salesOrder?.reference_number?.length > 0 ? [
            {
              label: 'REF Number',
              value: salesOrder?.reference_number ? salesOrder?.reference_number : 'No REF Number',
              icon: <Iconify
                icon="carbon:term-reference"
                sx={{ color: 'text.primary' }}
              />,
              hasValue: salesOrder?.reference_number?.length > 0,
            },
          ] : [],
          {
            label: 'Order Date',
            value: fDate(salesOrder?.date),
            icon: <Iconify
              icon="solar:calendar-date-bold"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: salesOrder?.date?.length > 0,
          },
          {
            label: 'Installed By Us',
            value: <RadioGroup
              name="serviceType"
              value={localServiceType || 'retail'}
              onChange={handleServiceTypeChange}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 2, mt: -1 }}>
                <FormControlLabel
                  value="installed_by_us"
                  control={<Radio />}
                  label="YES"
                />
                <FormControlLabel
                  value="retail"
                  control={<Radio />}
                  label="NO"
                />
              </Box>
            </RadioGroup>,
            icon: <Iconify
              icon="fluent-mdl2:c-r-m-services"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: true,
          },
          {
            label: 'Has To Pay?',
            value: <Switch
              checked={serviceBooleanValues?.hasToPay}
              name="hasToPay"
              onChange={(e) => {
                setServiceBooleanValues((prev) => ({ ...prev, hasToPay: e.target.checked }));
              }}
              sx={{ maxWidth: 56, mt: -1 }}
            />,
            icon: <Iconify
              icon="material-symbols:paid-outline"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: true,
          },
          {
            label: 'By Factory?',
            value: <Switch
              checked={serviceBooleanValues?.byFactory}
              name="byFactory"
              onChange={(e) => {
                setServiceBooleanValues((prev) => ({ ...prev, byFactory: e.target.checked }));
              }}
              sx={{ maxWidth: 56, mt: -1 }}
            />,
            icon: <Iconify
              icon="lucide:factory"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: true,
          },
          {
            label: 'Service Place',
            value: <Box
              sx={{
                width: 200,
              }}
            >
              <Autocomplete
                sx={{ width: '100%' }}
                value={servicePlace || null}
                onChange={(e, newValue) => {
                  setServicePlace(newValue);
                }}
                options={SERVICE_PLACE_OPTIONS}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, i) => (
                  <ListItem {...props} key={`${i.id}-option`}>
                    {i.name}
                  </ListItem>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((p, i) => (
                    <Chip
                      {...getTagProps({ i })}
                      key={p.id}
                      size="small"
                      variant="soft"
                      label={p.name}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        height: '37px',
                        '& input': {
                          padding: '0 8px',
                          height: '37px',
                          lineHeight: '37px'
                        }
                      }
                    }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        top: '-10px',
                        transform: 'translate(14px, 0px) scale(0.75)'
                      }
                    }}
                  />
                )}
              />
            </Box>,
            icon: <Iconify
              icon="mdi:place-outline"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: true,
          },

        ].map((item, index) => (
          <Stack key={item?.label || index} spacing={1.5} direction="row">
            {item?.icon}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              {item?.hasValue && (
                <ListItemText
                  primary={item?.label}
                  secondary={item?.value}
                  primaryTypographyProps={{ typography: 'body2', color: 'text.secondary', mb: 0.5 }}
                  secondaryTypographyProps={{
                    component: 'span',
                    color: 'text.secondary',
                    typography: 'subtitle2',
                  }}
                />
              )}
            </Box>
          </Stack>
        ))}
      </Box>

      {servicePlace?.id === 1 && (

        <Box sx={{
          p: 3,
          gap: 1,
          display: 'flex',
          flexDirection: !isMobile ? 'row' : 'column',
          ml: !isMobile ? 2 : 0,
          mt: 0,
          mb: -2,
          overflow: 'auto',
          justifyContent: 'flex-start',
        }}>
          <TextField
            name="address"
            label="Address"
            value={serviceAddress || ''}
            onChange={(e) => setServiceAddress(e.target.value)}
            sx={{
              minWidth: '100%',
            }}
          />
        </Box>

      )}

      <Box sx={{
        p: 3,
        gap: 1,
        display: 'flex',
        flexDirection: !isMobile ? 'row' : 'column',
        ml: !isMobile ? 2 : 0,
        mt: 0,
        overflow: 'auto',
        justifyContent: 'flex-start',
      }}>
        <TextField
          name="notes"
          label="Notes"
          value={serviceNotes || service?.serviceNotes || ''}
          onChange={(e) => setServiceNotes(e.target.value)}
          multiline
          rows={2}
          sx={{
            minWidth: !isMobile ? (!service ? serviceFiles.length === 0 ? 1040 : 1040 - (serviceFiles.length * 80) : '100%') : '100%',
          }}
        />
        {!service && (
          <MultiFilePreview
            key='preview-issued-attachments'
            thumbnail
            files={serviceFiles || []}
            onRemove={handleClickRemoveFile}
            onDownload={handleDownloadFile}
            sx={{ width: '100%', maxWidth: 500 }}
            isService
            isProject={false}
            moduleType="issued"
            lastNode={
              (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff)) ? (
                <Box sx={{ width: '100%', maxWidth: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <UploadBox onDrop={(files) => {
                    if (files && files.length) {
                      const uniqueFiles = files.filter((file) =>
                        !serviceFiles.some((existingFile) => existingFile.name === file.name)
                      );
                      if (uniqueFiles.length > 0) {
                        const filesToAdd = uniqueFiles.map((file) => ({
                          ...file,
                          fileUrl: URL.createObjectURL(file),
                          name: file.name,
                          isNew: true,
                          attachment_type: 'issued',
                        }));
                        setServiceFiles((prev) => [...prev, ...filesToAdd]);
                      }
                      else {
                        toast.error('File already exists');
                      }
                    }
                  }} />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Issued files
                  </Typography>
                </Box>
              ) : null
            }
          />
        )}
      </Box>

      <Box sx={{
        p: 3,
        gap: 1,
        display: 'flex',
        flexDirection: 'row',
        ml: 0,
        mt: 0,
        overflow: 'auto'
      }}>
        {[
          {
            label: `${items?.length} Product(s), 
              Total Qty: ${items?.reduce((total, product) => total + product.quantity, 0)}`,
            icon: <Iconify
              icon="fluent-mdl2:product-list"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: items?.length > 0,
            value: (
              !isMobile ? (
                <ServiceDetailsContentOverviewTableIssues
                  serviceItems={serviceItems}
                  selectedListItems={selectedListItems}
                  setSelectedListItems={setSelectedListItems}
                  containerRef={containerRef}
                  loadedServiceIssues={loadedServiceIssues}
                  openServiceItems={openServiceItems}
                  addIssue={addIssue}
                  removeIssue={removeIssue}
                  canAddIssue={canAddIssue}
                  changeQuantity={changeQuantity}
                />
              ) : (
                <ServiceDetailsContentOverviewTableIssuesMobile
                  serviceItems={serviceItems}
                  selectedListItems={selectedListItems}
                  setSelectedListItems={setSelectedListItems}
                  containerRef={containerRef}
                  loadedServiceIssues={loadedServiceIssues}
                  openServiceItems={openServiceItems}
                  addIssue={addIssue}
                  removeIssue={removeIssue}
                  canAddIssue={canAddIssue}
                  changeQuantity={changeQuantity}
                />
              )
            ),

          },
        ].map((item, index) => (
          <Stack key={item?.label || index} spacing={1.5} direction="row" sx={{ minWidth: '100%' }}>
            {item?.icon}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              {item?.value && (
                <ListItemText
                  primary={item?.label}
                  secondary={item?.value}
                  primaryTypographyProps={{ typography: 'body2', color: 'text.secondary', mb: 0.5 }}
                  secondaryTypographyProps={{
                    component: 'span',
                    color: 'text.secondary',
                    typography: 'subtitle2',
                  }}
                  sx={{ width: '100%' }}
                />
              )}
            </Box>
          </Stack>
        ))}
      </Box>
      <ServiceDetailsContentOverviewModalService salesOrder={salesOrder} items={serviceItems} open={openServiceItems.value} onClose={openServiceItems.onFalse} />
    </>
  );
}
