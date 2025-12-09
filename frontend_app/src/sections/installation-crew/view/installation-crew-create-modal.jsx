import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useCallback } from "react";
import { useBoolean } from "src/hooks/use-boolean";
import { InstallationCrewNewEditForm } from "../installation-crew-new-edit-form";



export function InstallationCrewCreateModal({ 
    openModal,
    refetchInstallationCrews, 
}) {

    const currentInstallationCrewId = null;

    const openModalState = useBoolean(true);
    const handleReturnList = useCallback(
        () => {
            openModal.onFalse();
        },
        [openModal]
    );

    return (
        <Dialog open={openModal.value} maxWidth="xl" fullWidth onClose={handleReturnList}>
            <DialogTitle>{currentInstallationCrewId ? "Edit installation crew" : "Create a new installation crew"}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <InstallationCrewNewEditForm
                        currentInstallationCrewId={currentInstallationCrewId}
                        onReturnList={handleReturnList}
                        refetchInstallationCrews={refetchInstallationCrews}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
}