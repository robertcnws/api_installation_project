import { Typography, Stack, Button } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { fDate, fDateTime } from 'src/utils/format-time';
import { Label } from 'src/components/label';
import { CONFIG } from 'src/config-global';
import axios from 'axios';

export const WelcomeTypography = ({
    userLogged,
    manualUpdatingJobsData,
    jobsUpdatingTimeData,
    itemsZohoSenitron,
    setUpdating,
    setError,
    handleSetManualUpdatingJobs,
    setTitleLinearProgress,
    isMobile
}) => (
    <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi {userLogged?.data.first_name || userLogged?.data.firstName} {userLogged?.data.last_name || userLogged?.data.lastName}, Welcome back 👋
        <br />
        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }}>
            {manualUpdatingJobsData?.isRunning ? (
                <Button sx={{ cursor: 'pointer', border: '1px solid #ddd', fontSize: '11px' }} color='warning' disabled>
                    <Iconify icon="solar:refresh-bold" /> {!isMobile ? `Update in progress...` : `Updating`}
                </Button>
            ) : (
                <Button sx={{ cursor: 'pointer', border: '1px solid #ddd', fontSize: '11px' }} color='warning' onClick={() => {
                    // setLoading(true);
                    // setComponent('Zoho & Senitron Last Info');
                    setUpdating(true);
                    const payload = {
                        items: itemsZohoSenitron.filter(it => it.assets.length > 0),
                        username: userLogged?.data.username,
                    };
                    setTitleLinearProgress('Updating Items Assets Info...');
                    handleSetManualUpdatingJobs(true);
                    axios.post(`${CONFIG.apiUrl}/api_zoho/create_zoho_items_assets_track/`, payload)
                        .then(() => {
                            setTitleLinearProgress('Loading Inventory Items Updated Info from Zoho...');
                            return axios.post(`${CONFIG.apiUrl}/api_zoho/load/inventory_items/`, {
                                username: userLogged?.data.username,
                            });
                        })
                        .then(() => {
                            setTitleLinearProgress('Loading Items Updated Info from Senitron...');
                            return axios.post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/`, {
                                username: userLogged?.data.username,
                            });
                        })
                        .then(() => {
                            setTitleLinearProgress('Loading Assets Logs Updated Info from Senitron...');
                            return axios.post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/logs/`, {
                                username: userLogged?.data.username,
                            });
                        })
                        .then(() => {
                            setTitleLinearProgress('Fetching updates shipments from Zoho...');
                            return axios.post(`${CONFIG.apiUrl}/api_zoho/load/inventory_shipments/`, {
                                start_date: fDate(new Date(), 'YYYY-MM-DD'),
                                username: userLogged?.data.username,
                            });
                        })
                        .then(() => {
                            handleSetManualUpdatingJobs(false);
                        })
                        .catch(() => {
                            setError('There was an error updating the inventory.');
                        })
                        .finally(() => {
                            setUpdating(false);
                        });



                    // axios
                    //   .post(`${CONFIG.apiUrl}/api_zoho/create_zoho_items_assets_track/`, payload)
                    //   .then(() => {
                    //     setTitleLinearProgress('Loading Inventory Items Updated Info from Zoho...');
                    //     axios
                    //       .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_items/`)
                    //       .then(() => {
                    //         setTitleLinearProgress('Loading Items Updated Info from Senitron...');
                    //         axios
                    //           .post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/`)
                    //           .then(() => {
                    //             setTitleLinearProgress('Fetching updates shipments from Zoho...');
                    //             const date = fDate(new Date(), 'YYYY-MM-DD');
                    //             axios
                    //               .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_shipments/`, {
                    //                 start_date: date,
                    //               })
                    //               .then(() => {
                    //                 console.log('Zoho Inventory item fetched');
                    //                 console.log('Senitron Inventory item fetched');
                    //                 console.log('Zoho Inventory shipments fetched');
                    //                 handleSetManualUpdatingJobs(false);
                    //               });
                    //           });
                    //       })
                    //       .catch((err) => {
                    //         console.error('Error fetching senitron inventory item asset:', err);
                    //         setError('There was an error fetching senitron inventory item asset.');
                    //       })
                    //       .finally(() => {
                    //         setUpdating(false);
                    //       });
                    //   })
                    //   .catch((err) => {
                    //     console.error('Error fetching inventory item:', err);
                    //     setError('There was an error fetching the inventory item.');
                    //   })
                }}>
                    <Iconify icon="solar:refresh-bold" /> {!isMobile ? `Update from Zoho & Senitron` : `Update`}
                </Button>
            )}
            {jobsUpdatingTimeData && (
                <>
                    {!isMobile ? (
                        <Label sx={{ border: '1px solid #ddd', ml: 1, fontSize: '10px' }} color='info'>
                            Last update: <br/><b> {fDateTime(jobsUpdatingTimeData?.lastUpdated)}</b>
                        </Label>
                    ) : (
                        <Typography variant="caption" sx={{ ml: 1, fontSize: '10px' }} color='info'>
                            Last update: <br/><b> {fDateTime(jobsUpdatingTimeData?.lastUpdated)}</b>
                        </Typography>
                    )}
                </>
            )}
        </Stack>
    </Typography >
);