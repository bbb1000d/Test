import { ChangeEvent, useCallback, useState } from 'react';

const MAX_SIZE = 20 * 1024 * 1024;
const SUPPORTED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

type AddTrustedSource = (title: string) => void;

function useTrustedUpload(addTrustedSource: AddTrustedSource) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        if (!SUPPORTED_TYPES.includes(file.type)) {
          errors.push(`${file.name} is not a supported format.`);
          return;
        }

        if (file.size > MAX_SIZE) {
          errors.push(`${file.name} is larger than 20MB.`);
          return;
        }

        addTrustedSource(file.name.replace(/\.[^.]+$/, ''));
      });

      setUploadError(errors.length > 0 ? errors.join(' ') : null);
      event.target.value = '';
    },
    [addTrustedSource]
  );

  return { handleUpload, uploadError };
}

export default useTrustedUpload;
