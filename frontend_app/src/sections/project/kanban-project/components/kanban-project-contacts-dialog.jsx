import axios from 'axios';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import { DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

const ITEM_HEIGHT = 64;

// ----------------------------------------------------------------------

export function KanbanProjectContactsDialog({ project, task, assignee = [], contacts, open, onClose, refetchProject, isRemove }) {
  const [searchContact, setSearchContact] = useState('');

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [selectedContact, setSelectedContact] = useState(null);

  const confirmRemove = useBoolean();

  const handleSearchContacts = useCallback((event) => {
    setSearchContact(event.target.value);
  }, []);

  const dataFiltered = applyFilter({ inputData: isRemove ? task?.users_assignees : contacts, query: searchContact });

  const notFound = !dataFiltered.length && !!searchContact;

  const handleAddUser = useCallback(
    async (userToAdd) => {

      const newAssignees = [...task.users_assignees, userToAdd];

      const taskId = task.id;
      const projectId = project.id;

      try {
        const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${projectId}/task/${taskId}/users/`, {
          usersAssignees: newAssignees,
          userReporter: userLogged?.data,
        });
        const response = await promise;
        if (response.data) {
          refetchProject?.();
        }
      } catch (error) {
        console.error(error);
      }

    },
    [project, task, userLogged, refetchProject]
  );

  const handleRemoveUser = useCallback(
    async (userToRemove) => {

      const taskId = task.id;
      const projectId = project.id;

      try {
        const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${projectId}/task/${taskId}/user/${userToRemove.id}/`, {
          data: {
            userReporter: userLogged?.data,
          },
        });
        const response = await promise;
        if (response.data) {
          refetchProject?.();
        }
      } catch (error) {
        console.error(error);
      }

    },
    [project, task, userLogged, refetchProject]
  );

  const onRemove = useCallback(
    (contact) => {
      setSelectedContact(contact);
      confirmRemove.onTrue();
    }, [confirmRemove]);

  return (
    <>
      <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
        <DialogTitle sx={{ pb: 0 }}>
          {isRemove ? 'Users to remove' : 'Users to add'} <Typography component="span">({isRemove ? task?.users_assignees.length : contacts.length})</Typography>
        </DialogTitle>

        <Box sx={{ px: 3, py: 2.5 }}>
          <TextField
            fullWidth
            value={searchContact}
            onChange={handleSearchContacts}
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {notFound ? (
            <SearchNotFound query={searchContact} sx={{ mt: 3, mb: 10 }} />
          ) : (
            <Scrollbar sx={{ height: ITEM_HEIGHT * 3, px: 2.5 }}>
              <Box component="ul">
                {dataFiltered.map((contact) => {
                  const checked = assignee.map((person) => person.name).includes(contact.name);

                  return (
                    <Box
                      component="li"
                      key={contact.id}
                      sx={{
                        gap: 2,
                        display: 'flex',
                        height: ITEM_HEIGHT,
                        alignItems: 'center',
                      }}
                    >
                      <Avatar src={contact.avatarUrl} />

                      <ListItemText
                        primaryTypographyProps={{ typography: 'subtitle2', sx: { mb: 0.25 } }}
                        secondaryTypographyProps={{ typography: 'caption' }}
                        primary={contact.name}
                        secondary={contact.email}
                      />

                      <Button
                        size="small"
                        color={isRemove ? 'error' : checked ? 'primary' : 'inherit'}
                        startIcon={
                          <Iconify
                            width={16}
                            icon={isRemove ? 'stash:minus-solid' : checked ? 'eva:checkmark-fill' : 'mingcute:add-line'}
                            sx={{ mr: -0.5 }}
                          />
                        }
                        onClick={() => isRemove ? onRemove(contact) : handleAddUser(contact)}
                      >
                        {isRemove ? 'Remove' : checked ? 'Assigned' : 'Assign'}
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Scrollbar>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog >

      <ConfirmDialog
        open={confirmRemove.value}
        onClose={confirmRemove.onFalse}
        title="Delete User Assignee"
        maxWidth="xs"
        content={
          <>
            Are you sure want to delete this user assignee <strong> {selectedContact?.name} </strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={() => {
            handleRemoveUser(selectedContact);
            confirmRemove.onFalse();
          }}>
            Delete
          </Button>
        }
      />
    </>
  );
}

function applyFilter({ inputData, query }) {
  if (query) {
    inputData = inputData.filter(
      (contact) =>
        contact.name.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        contact.email.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  return inputData;
}
