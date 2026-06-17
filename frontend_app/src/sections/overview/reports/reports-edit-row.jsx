import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONFIG } from 'src/config-global';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingButton } from '@mui/lab';
import { Box, Stack } from '@mui/material';

const formatMoney = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '0.00';
    }
    return Number(value).toFixed(2);
};

export function ReportsEditRow({ row, onCloseEdit }) {
    const router = useRouter();

    const userLogged = useMemo(
        () => JSON.parse(sessionStorage.getItem('userLogged')),
        []
    );

    const ReportsRowSchema = zod.object({
        duration: zod.coerce.number().min(1, { message: 'Duration is required!' }),
        projectAmount: zod.coerce.number().min(-1000000, { message: 'Project Amount is required!' }),
        installationAmount: zod.coerce.number().min(-1000000, { message: 'Installation Amount is required!' }),
        installationCost: zod.coerce.number().min(-1000000, { message: 'Installation Cost is required!' }),
        installationProfit: zod.coerce.number().min(-1000000, { message: 'Installation Profit is required!' }),
        notes: zod.string().optional(),
    });

    const defaultValues = useMemo(
        () => ({
            duration: row?.projectInfo?.duration ?? 1,
            projectAmount: formatMoney(row?.projectAmount),
            installationAmount: formatMoney(row?.installationAmount),
            installationCost: formatMoney(row?.installationCost),
            installationProfit: formatMoney(row?.installationProfit),
            notes: row?.notes ?? '',
        }),
        [row]
    );

    const methods = useForm({
        mode: 'onSubmit',
        resolver: zodResolver(ReportsRowSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitting },
        watch,
    } = methods;

    // ⬇️ Valores que vamos a “escuchar”
    const installationAmountWatch = watch('installationAmount');
    const installationCostWatch = watch('installationCost');
    const durationWatch = watch('duration');
    const projectAmountWatch = watch('projectAmount');
    const notesWatch = watch('notes');

    // ⬇️ Cada vez que cambien amount o cost, recalculamos profit
    useEffect(() => {
        const amount = Number(installationAmountWatch);
        const cost = Number(installationCostWatch);
        const profit = amount - cost;
        const formattedProfit = Number.isFinite(profit) ? profit.toFixed(2) : '0.00';

        methods.setValue('installationProfit', formattedProfit, {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [installationAmountWatch, installationCostWatch, methods]);

    const onSubmit = handleSubmit(async (data) => {
        const url = `${CONFIG.apiUrl}/projects/update/project/${row?.id}/manage-profit-report/`;

        try {
            await axios.post(url, {
                ...data,
                userReporter: userLogged?.data,
            });
            reset();
            toast.success('Update success!');
            // router.push(paths.dashboard.role.list);
            onCloseEdit();
        } catch (err) {
            console.error(err);
            toast.error(
                err?.response?.data?.error
                    ? err.response.data.error
                    : err?.response?.data?.detail || 'Error updating report'
            );
        }
    });

    const handleMoneyBlur = (fieldName) => (event) => {
        const raw = event.target.value;
        const num = Number(raw);
        const formatted = Number.isFinite(num) ? num.toFixed(2) : '0.00';
        methods.setValue(fieldName, formatted, { shouldValidate: true });
    };

    const isFormChanged = (
        durationWatch !== defaultValues.duration ||
        projectAmountWatch !== defaultValues.projectAmount ||
        installationAmountWatch !== defaultValues.installationAmount ||
        installationCostWatch !== defaultValues.installationCost ||
        notesWatch !== defaultValues.notes
    );

    return (
        <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: 3 }}>
                <Field.Text
                    name="duration"
                    label="Duration"
                    placeholder="Duration"
                    type="number"
                    increment={1}
                    sx={{ mb: 3 }}
                />

                <Field.Text
                    name="projectAmount"
                    label="Project Amount"
                    placeholder="Project Amount"
                    type="number"
                    increment={0.01}
                    min={-1000000}
                    sx={{ mb: 3 }}
                    onBlur={handleMoneyBlur('projectAmount')}
                />

                <Field.Text
                    name="installationAmount"
                    label="Installation Amount"
                    placeholder="Installation Amount"
                    type="number"
                    increment={0.01}
                    min={-1000000}
                    sx={{ mb: 3 }}
                    onBlur={handleMoneyBlur('installationAmount')}
                />

                <Field.Text
                    name="installationCost"
                    label="Installation Cost"
                    placeholder="Installation Cost"
                    type="number"
                    increment={0.01}
                    min={-1000000}
                    sx={{ mb: 3 }}
                    onBlur={handleMoneyBlur('installationCost')}
                />

                <Field.Text
                    name="installationProfit"
                    label="Installation Profit"
                    placeholder="Installation Profit"
                    type="number"
                    increment={0.01}
                    min={-1000000}
                    sx={{ mb: 3 }}
                    // Este campo ahora es sólo lectura / deshabilitado
                    disabled
                />

                <Field.Text
                    name="notes"
                    label="Notes"
                    placeholder="Notes"
                    multiline
                    minRows={3}
                    sx={{ mb: 3 }}
                />
            </Box>

            <Stack
                alignItems="flex-end"
                sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}
            >
                <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    disabled={isSubmitting || !isFormChanged}
                    sx={{ mr: 2 }}
                >
                    Update report
                </LoadingButton>
                <LoadingButton
                    type="button"
                    variant="outlined"
                    onClick={onCloseEdit}
                    disabled={isSubmitting}
                >
                    Cancel
                </LoadingButton>
            </Stack>
        </Form>
    );
}
