import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Link, Button, Dialog, TextField, IconButton, Typography, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

function prettifyKey(key) {
    return key
        .replace('start_date', 'installation_date')
        .replace('end_date', 'finish_date')
        .replace('project', 'installation')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase());

}

function isValidDate(value) {
    if (value instanceof Date) {
        return !Number.isNaN(value.getTime());
    }
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, searchTerm, activeOccurrence, counter) {
    if (!searchTerm) return text;
    const input = String(text);
    const escapedSearchTerm = escapeRegExp(searchTerm);
    const regex = new RegExp(escapedSearchTerm, 'gi');
    const result = [];
    let match = regex.exec(input);
    let lastIndex = 0;
    while (match !== null) {
        const [matchedText] = match;             
        const { index: matchIndex } = match;
        
        result.push(input.substring(lastIndex, matchIndex));

        const occurrenceIndex = counter.current;
        counter.current += 1;

        const style =
            occurrenceIndex === activeOccurrence
                ? { backgroundColor: 'orange', display: 'inline-block' }
                : { backgroundColor: 'yellow', display: 'inline-block' };

        result.push(
            <Box
                key={occurrenceIndex}
                component="span"
                sx={style}
                data-occurrence={occurrenceIndex}
            >
                {matchedText}
            </Box>
        );
        const { lastIndex: newLastIndex } = regex;
        lastIndex = newLastIndex;
        match = regex.exec(input);
    }
    result.push(input.substring(lastIndex));
    return result;
}



function PrettyPrintData({ data, level = 0, searchTerm = '', activeOccurrence, counter }) {
    const indent = level * 2;
    if (Array.isArray(data)) {
        return data.map((item, index) => (
            <Box key={index} sx={{ ml: indent, mb: 0.3 }}>
                <PrettyPrintData
                    data={item}
                    level={level}
                    searchTerm={searchTerm}
                    activeOccurrence={activeOccurrence}
                    counter={counter}
                />
            </Box>
        ));
    }
    if (data && typeof data === 'object') {
        return Object.entries(data).map(([key, value]) => (
            <Box key={key} sx={{ ml: indent, mb: 0.3 }}>
                <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', textAlign: 'left' }}
                >
                    {highlightText(prettifyKey(key), searchTerm, activeOccurrence, counter)}:{' '}
                    {
                        isValidDate(value) && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))
                            ? <b>{highlightText(fDateTime(value), searchTerm, activeOccurrence, counter)}</b>
                            : (
                                typeof value === 'object'
                                    ? ''
                                    : <b>{
                                        typeof value === 'boolean'
                                            ? (value ? 'YES' : 'NO')
                                            : highlightText(String(value), searchTerm, activeOccurrence, counter)
                                    }</b>
                            )
                    }
                </Typography>
                {typeof value === 'object' && value !== null && (
                    <PrettyPrintData
                        data={value}
                        level={level + 1}
                        searchTerm={searchTerm}
                        activeOccurrence={activeOccurrence}
                        counter={counter}
                    />
                )}
            </Box>
        ));
    }
    return (
        <Typography
            variant="caption"
            sx={{ ml: indent, fontFamily: 'monospace', textAlign: 'left' }}
        >
            {highlightText(String(data), searchTerm, activeOccurrence, counter)}
        </Typography>
    );
}

export default function ServiceDetailsCommentListJsonDisplay({ data, action, name }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeOccurrence, setActiveOccurrence] = useState(0);
    const [isTruncated, setIsTruncated] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const containerRef = useRef(null);
    const modalContainerRef = useRef(null);
    const occurrenceCounter = useRef({ current: 0 });

    useEffect(() => {
        occurrenceCounter.current = 0;
        setActiveOccurrence(0);
    }, [searchTerm, data]);

    useEffect(() => {
        if (!openModal) {
            setSearchTerm('');
            setActiveOccurrence(0);
        }
    }, [openModal]);

    useEffect(() => {
        if (containerRef.current) {
            setIsTruncated(containerRef.current.scrollHeight > containerRef.current.clientHeight);
        }
    }, [data]);

    useEffect(() => {
        if (searchTerm) {
            const container = modalContainerRef.current;
            if (container) {
                requestAnimationFrame(() => {
                    const occurrences = container.querySelectorAll('[data-occurrence]');
                    const target = occurrences[activeOccurrence];
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        }
    }, [activeOccurrence, searchTerm]);

    const countOccurrences = (text, term) => {
        if (!term) return 0;
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, 'gi');
        return (text.match(regex) || []).length;
    }

    const generatePrettyText = useCallback(
        (info, indent = 0) => {
            let result = '';
            const indentStr = ' '.repeat(indent);
            if (Array.isArray(info)) {
                info.forEach(item => {
                    result += `${generatePrettyText(item, indent)}\n`;
                });
            } else if (info && typeof info === 'object') {
                Object.entries(info).forEach(([key, value]) => {
                    result += `${indentStr}${prettifyKey(key)}: `;
                    if (typeof value === 'object' && value !== null) {
                        result += `\n${generatePrettyText(value, indent + 2)}`;
                    } else {
                        result += `${String(value)}\n`;
                    }
                });
            } else {
                result += `${indentStr}${String(info)}\n`;
            }
            return result;
        },
        []
    );

    const fullText = useMemo(() => generatePrettyText(data), [data, generatePrettyText]);
    const totalOccurrences = useMemo(() => countOccurrences(fullText, searchTerm), [fullText, searchTerm]);

    return (
        <Box>
            <Box sx={{ mt: 1 }}>
                <Link
                    component="button"
                    variant="caption"
                    sx={{
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'none'
                        }
                    }}
                    onClick={() => setOpenModal(true)}
                >
                    <Iconify icon="hugeicons:view" sx={{ mr: 1, mb: -0.5 }} />
                    View all info
                </Link>
            </Box>

            <Dialog
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setSearchTerm('');
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Info about: {action} by {name}</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Search"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                        InputProps={{
                            startAdornment: (
                                <Iconify icon="eva:search-fill" sx={{ mr: 1 }} />
                            ),
                            endAdornment: (
                                <Iconify
                                    icon="eva:close-outline"
                                    onClick={() => setSearchTerm('')}
                                    sx={{ cursor: 'pointer' }}
                                />
                            )
                        }}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                    {totalOccurrences > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'left', mb: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
                            <Typography variant="caption" sx={{ mb: 1, mr: 3 }}>
                                Found {totalOccurrences} occurrences of &quot;{searchTerm}&quot; in the data.
                                ({activeOccurrence === 0 ? '1' : activeOccurrence + 1} of {totalOccurrences}):
                            </Typography>
                            <IconButton sx={{ mb: 1, mt: -1 }}
                                onClick={() => {
                                    setActiveOccurrence((prev) => (totalOccurrences > 0 ? (prev - 1 + totalOccurrences) % totalOccurrences : 0));
                                }}
                            >
                                <Iconify icon="fluent:previous-16-filled" />
                            </IconButton>
                            <IconButton sx={{ mb: 1, mt: -1 }}
                                onClick={() => {
                                    setActiveOccurrence((prev) => (totalOccurrences > 0 ? (prev + 1) % totalOccurrences : 0));
                                }}
                            >
                                <Iconify icon="fluent:next-16-filled" />
                            </IconButton>
                        </Box>
                    )}
                    <Box
                        ref={modalContainerRef}
                        sx={{
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 300,
                            overflowY: 'auto'
                        }}
                    >
                        <PrettyPrintData
                            data={data}
                            searchTerm={searchTerm}
                            activeOccurrence={activeOccurrence}
                            counter={occurrenceCounter}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
