import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteUser } from '../hooks/useUsers';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertTriangle } from 'lucide-react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field';

export const DeleteAccountDialog = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const deleteUserMutation = useDeleteUser();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE to confirm');
      return;
    }

    if (!user?.userId) {
      console.error('No user ID available');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');

    try {
      await deleteUserMutation.mutateAsync(user.userId);
      
      // Logout and redirect to home
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setErrorMessage('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen && !isDeleting) {
      setConfirmText('');
      setErrorMessage('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p className="font-semibold text-foreground">
              This action cannot be undone!
            </p>
            <p>
              This will permanently delete your account and remove all of your data from our servers.
            </p>
            <p>
              Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Confirm Deletion</FieldLabel>
            <FieldGroup>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                disabled={isDeleting}
                className={errorMessage ? 'border-red-500' : ''}
              />
            </FieldGroup>
            {errorMessage && (
              <FieldError>{errorMessage}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== 'DELETE'}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
