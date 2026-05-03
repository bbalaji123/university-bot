import React from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  )
}

export default Modal
