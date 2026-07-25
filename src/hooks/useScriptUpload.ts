import type { RefObject } from 'react';
import { parseScriptFile } from '../utils/scriptUtils';
import type { Role } from '../types';

interface UseScriptUploadArgs {
  setCustomScriptRoles: (roles: Role[] | null) => void;
  setScriptName: (name: string) => void;
  setScriptAuthor: (author: string) => void;
  showAlert: (message: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

// Parse an uploaded custom-script file into the current script, or clear back to the default set.
// Shared by StandardSetup and PlayerTracker.
export function useScriptUpload({ setCustomScriptRoles, setScriptName, setScriptAuthor, showAlert, fileInputRef }: UseScriptUploadArgs) {
  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseScriptFile(file)
      .then(({ name, author, roles, unknownRoles }) => {
        setCustomScriptRoles(roles);
        setScriptName(name);
        setScriptAuthor(author);
        if (unknownRoles.length > 0) {
          const list = unknownRoles.map(r => r.name).join(', ');
          showAlert(`This script includes custom character(s) not recognized by the app: ${list}. They'll still be usable, but their team was inferred from the script file and they won't have official icons or ability text.`);
        }
      })
      .catch(err => showAlert((err as Error).message));
  };

  const clearCustomScript = () => {
    setCustomScriptRoles(null);
    setScriptName('All Roles');
    setScriptAuthor('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return { handleScriptUpload, clearCustomScript };
}
