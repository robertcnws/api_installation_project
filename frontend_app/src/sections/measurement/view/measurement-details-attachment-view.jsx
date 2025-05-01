import { useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';

import { MeasurementEditAttachments } from 'src/sections/measurement/measurement-edit-attachments';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function MeasurementDetailsAttachmentView({
    measurement,
    refetchMeasurement,
    openDialogs,
    setOpenDialogs,
}) {

    const { isMobile } = useContext(LoadingContext);

    useEffect(() => {
        if (refetchMeasurement) {
            refetchMeasurement?.();
        }
    }, [refetchMeasurement]);


    const renderContent = (
        <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
            {measurement && (
                <MeasurementEditAttachments
                    measurement={measurement}
                    refetchMeasurement={refetchMeasurement}
                    id={measurement?.id}
                    name={measurement?.name}
                    type="measurement"
                    isMobile={isMobile}
                />
            )}
        </Card>
    );

    // const renderOverview = (
    //     // <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', maxHeight: 585, overflowY: 'auto' }}>
    //     //     <Box component="span" sx={{ width: '100%', color: 'text.secondary', mr: 2, display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
    //     //         Tasks
    //     //         <Select
    //     //             value={selectedStatusTask}
    //     //             onChange={handleChangeSelectedStatusTask}
    //     //             sx={{ ml: 2.5, width: 200, height: 30 }}
    //     //         >
    //     //             {TASK_STATUS_OPTIONS.map((option) => (
    //     //                 <MenuItem key={option.value} value={option.value}>
    //     //                     {option.label}
    //     //                 </MenuItem>
    //     //             ))}
    //     //         </Select>
    //     //     </Box>
    //     //     {filteredTasks.length > 0 && (
    //     //         <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8, display: 'flex', flexDirection: 'row' }}>
    //     //             <Autocomplete
    //     //                 options={filteredTasks ?? []}
    //     //                 getOptionLabel={(option) =>
    //     //                     `${option.measurement_default_task.measurement_stage.name} ${option.number} -- ${option.measurement_default_task.name} (${option.status})`
    //     //                 }
    //     //                 isOptionEqualToValue={(option, value) =>
    //     //                     value.measurement_default_task.id ? option.measurement_default_task.id === value.measurement_default_task.id :
    //     //                         option.measurement_default_task.id === value.measurement_default_task._id
    //     //                 }
    //     //                 value={selectedTask ?? null}
    //     //                 onChange={handleTaskChange}
    //     //                 renderOption={(props, stage, index) => {
    //     //                     let icon; let color;
    //     //                     if (stage.status === CONFIG.taskStatus.notStarted) {
    //     //                         icon = 'mdi:restart-off';
    //     //                         color = '#ed6c02'; // color warning
    //     //                     } else if (stage.status === 'in progress') {
    //     //                         icon = 'carbon:executable-program';
    //     //                         color = '#0288d1'; // color info
    //     //                     } else if (stage.status === 'finished') {
    //     //                         icon = 'rivet-icons:inbox-complete';
    //     //                         color = '#2e7d32'; // color success
    //     //                     } else {
    //     //                         icon = 'material-symbols:sms-failed';
    //     //                         color = '#d32f2f'; // color error
    //     //                     }

    //     //                     return (
    //     //                         <ListItem
    //     //                             {...props}
    //     //                             key={`${stage.measurement_default_task.id}-${index}-${stage.status}`}
    //     //                             style={{
    //     //                                 display: 'flex',
    //     //                                 alignItems: 'center',
    //     //                                 color,
    //     //                                 padding: '4px 8px'
    //     //                             }}
    //     //                         >
    //     //                             <Iconify icon={icon} sx={{ mr: 1 }} />
    //     //                             <span>
    //     //                                 {stage.measurement_default_task.measurement_stage.name} {stage.number} -- {stage.measurement_default_task.name} <br />
    //     //                                 <strong>({stage.status})</strong>
    //     //                             </span>
    //     //                         </ListItem>
    //     //                     );
    //     //                 }}
    //     //                 renderInput={(params) => (
    //     //                     <TextField {...params} label="Select Task" variant="outlined" />
    //     //                 )}
    //     //                 sx={{ width: '100%' }}
    //     //             />
    //     //         </Box>
    //     //     )}
    //     //     {selectedTask && (
    //     //         <Box sx={{ width: '100%', color: 'text.secondary', mt: 2, display: 'flex', flexDirection: 'row' }}>
    //     //             <MeasurementEditTaskAttachments
    //     //                 measurement={measurement}
    //     //                 refetchMeasurement={refetchMeasurement}
    //     //                 task={selectedTask}
    //     //                 setTask={setSelectedTask}
    //     //                 newFiles={newFiles}
    //     //                 setNewFiles={setNewFiles}
    //     //                 id={measurementId}
    //     //                 name={measurement?.name}
    //     //                 type="task"
    //     //                 isMobile={isMobile}
    //     //                 listPermissions={listPermissions}
    //     //             />
    //     //         </Box>
    //     //     )}
    //     // </Card >
        
    // );

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={8}>
                {renderContent}
            </Grid>

            {/* <Grid xs={12} md={4}>
                {renderOverview}
            </Grid> */}
        </Grid>
    );
}
