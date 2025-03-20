
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, ListItem, IconButton, Table, TableContainer, TableHead, TableCell, TableBody, TableRow, Switch, TextField, Autocomplete, Chip, InputAdornment } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

import { filteredSomeDescription } from 'src/utils/project-tasks-utils';


import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useState } from 'react';



export function ServiceDetailsContentOverviewTableIssues({
    serviceItems,
    selectedListItems,
    setSelectedListItems,
    containerRef,
    loadedServiceIssues,
    openServiceItems,
    addIssue,
    removeIssue,
    canAddIssue,
    changeQuantity,
}) {

    return (
        <>
            <TableContainer ref={containerRef} sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table sx={{ maxHeight: 500 }} stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell width={170}>
                                <Typography variant="caption" color="text.secondary">Product</Typography>
                            </TableCell>
                            <TableCell width={30}>
                                <Typography variant="caption" color="text.secondary">Service?</Typography>
                            </TableCell>
                            <TableCell width={420}>
                                <Typography variant="caption" color="text.secondary">Issue</Typography>
                            </TableCell>
                            <TableCell width={200}>
                                <Typography variant="caption" color="text.secondary">Notes</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedListItems?.map((product) => (
                            <TableRow key={product.line_item_id}>
                                <TableCell width={170}>
                                    <ListItem key={product.line_item_id}>
                                        <ListItemText
                                            primary={product.name}
                                            secondary={
                                                <Stack direction="column" spacing={1}>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.primary"
                                                        sx={{ mb: 1, whiteSpace: 'pre-line' }}
                                                    >
                                                        {`Qty: ${product.quantity}\n${filteredSomeDescription(product.description, ['sku', 'size'])}`}
                                                    </Typography>
                                                </Stack>
                                            }
                                            primaryTypographyProps={{
                                                variant: 'caption',
                                                color: 'text.secondary',
                                            }}
                                            secondaryTypographyProps={{
                                                variant: 'caption',
                                                color: 'text.primary',
                                            }}
                                        />
                                    </ListItem>
                                </TableCell>
                                <TableCell width={30}>
                                    <Switch
                                        checked={product.selected}
                                        onChange={(e) => {
                                            setSelectedListItems((prev) =>
                                                prev.map((item) =>
                                                    item.line_item_id === product.line_item_id
                                                        ? { ...item, selected: e.target.checked }
                                                        : item
                                                )
                                            );
                                            if (e.target.checked && product.issues.length === 0) {
                                                addIssue(product);
                                            }
                                        }}
                                        name="checkedB"
                                        inputProps={{ 'aria-label': 'secondary checkbox' }}
                                    />
                                </TableCell>
                                <TableCell width={420}>
                                    {product.selected &&
                                        product.issues.map((issue, index) => (
                                            <ListItem key={`${product.line_item_id}-${issue.id}`}>
                                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 1 }}>
                                                    <Autocomplete
                                                        sx={{ width: 200 }}
                                                        value={issue.issue}
                                                        onChange={(e, newValue) => {
                                                            setSelectedListItems((prev) =>
                                                                prev.map((item) =>
                                                                    item.line_item_id === product.line_item_id
                                                                        ? {
                                                                            ...item, issues: item.issues.map((i) =>
                                                                                i.id === issue.id
                                                                                    ? {
                                                                                        ...i,
                                                                                        issue: newValue,
                                                                                        color: newValue ? 'default' : 'error.main'
                                                                                    }
                                                                                    : i
                                                                            )
                                                                        }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                        options={loadedServiceIssues.filter((si) => !product.issues?.map((it) => it?.issue?.id).includes(si.id))}
                                                        getOptionLabel={(option) => option.name}
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
                                                                label="Issue"
                                                                error={!issue.issue}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        '& fieldset': {
                                                                            borderColor: issue.color,
                                                                        },
                                                                        '&:hover fieldset': {
                                                                            borderColor: issue.color,
                                                                        },
                                                                        '&.Mui-focused fieldset': {
                                                                            borderColor: issue.color,
                                                                        },
                                                                    },
                                                                }}
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
                                                    <TextField
                                                        type='number'
                                                        variant="outlined"
                                                        size="small"
                                                        label="Qty"
                                                        sx={{ width: 120 }}
                                                        value={issue.quantity}
                                                        max={product.quantity}
                                                        min={1}
                                                        onChange={(e) => {
                                                            if (e.target.value > product.quantity || e.target.value < 1) {
                                                                e.target.value = product.quantity;
                                                            }
                                                            setSelectedListItems((prev) =>
                                                                prev.map((item) =>
                                                                    item.line_item_id === product.line_item_id
                                                                        ? {
                                                                            ...item, issues: item.issues.map((i) =>
                                                                                i.id === issue.id
                                                                                    ? { ...i, quantity: e.target.value }
                                                                                    : i
                                                                            )
                                                                        }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end" sx={{ display: 'flex', flexDirection: 'row', gap: 0, p: 0 }}>
                                                                    <IconButton
                                                                        onClick={() => changeQuantity(product, issue, 'add')}
                                                                        sx={{ p: 0, mr: 0 }}
                                                                        disabled={issue.quantity >= product.quantity}
                                                                    >
                                                                        <Add />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        onClick={() => changeQuantity(product, issue, 'remove')}
                                                                        sx={{ p: 0, mr: 0 }}
                                                                        disabled={issue.quantity <= 1}
                                                                    >
                                                                        <Remove />
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, maxWidth: 100, justifyContent: 'flex-end' }}>
                                                        {(index === product.issues.length - 1) && (
                                                            <IconButton
                                                                variant="outlined"
                                                                color='success'
                                                                onClick={() => addIssue(product)}
                                                                disabled={!canAddIssue(product)}
                                                                sx={{
                                                                    '&:hover': {
                                                                        boxShadow: 'none',
                                                                        backgroundColor: 'transparent',
                                                                    },
                                                                }}>
                                                                <Iconify icon="icons8:plus" sx={{ width: 28, height: 28 }} />
                                                            </IconButton>
                                                        )}
                                                        {(index > 0) && (
                                                            <IconButton
                                                                variant="outlined"
                                                                color='warning'
                                                                onClick={() => removeIssue(product, issue)}
                                                                sx={{
                                                                    '&:hover': {
                                                                        boxShadow: 'none',
                                                                        backgroundColor: 'transparent',
                                                                    },
                                                                }}>
                                                                <Iconify icon="lsicon:minus-outline" sx={{ width: 25, height: 25 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </ListItem>
                                        ))}
                                </TableCell>
                                <TableCell width={200}>
                                    {product.selected && <TextField
                                        multiline
                                        rows={product.issues.length + 1}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        value={product.notes}
                                        onChange={(e) => {
                                            setSelectedListItems((prev) =>
                                                prev.map((item) =>
                                                    item.line_item_id === product.line_item_id
                                                        ? { ...item, notes: e.target.value }
                                                        : item
                                                )
                                            );
                                        }}
                                    />}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {serviceItems?.length > 0 && (
                <Label
                    color="default"
                    sx={{ cursor: 'pointer', mt: 2 }}
                    onClick={() => {
                        openServiceItems.onTrue();
                    }}
                >
                    See {serviceItems?.length} service(s) items
                </Label>
            )}
        </>
    );
}