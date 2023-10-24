import { Upload } from "@carbon/icons-react";
import { Button, FormHelperText, Typography } from "@mui/material";
import { colors } from "constants/theme";
import { useFormikContext } from "formik";
import { useState } from "react";
import Dropzone, { DropzoneProps } from "react-dropzone";
import { Label } from "../label";

interface DropZoneProps extends DropzoneProps {
  name: string;
  label?: string;
  onChange?: any;
}

export const DropZone = <T extends {}>({
  name,
  label,
  onChange,
  ...otherProps
}: DropZoneProps) => {
  const { setFieldValue, values } = useFormikContext<T | any>();
  const [errors, setError] = useState<string[]>([]);

  return (
    <Dropzone
      minSize={0}
      accept={{ "image/*": [".png", ".gif", ".jpeg", ".jpg"] }}
      onDrop={(acceptedFiles, rejectedFiles) => {
        if (!acceptedFiles.length) {
          let err: string[] = [];
          rejectedFiles.forEach((item) => {
            err = [...err, ...item.errors.map((error) => error.message)];
          });
          setError(err);
        }
        if (otherProps.multiple) {
          setFieldValue(name, acceptedFiles);
        } else {
          setFieldValue(name, acceptedFiles[0]);
        }
        onChange ? onChange(acceptedFiles, rejectedFiles) : "";
        setError([]);
      }}
      {...otherProps}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <>
          {label && <Label className="text-sm ml-3" text={label} />}
          <div
            {...getRootProps()}
            className="drop-zone mt-2"
            style={{
              background: isDragActive ? colors.tertiary.light : "#fff",
            }}
          >
            <input {...getInputProps()} />
            {Array.isArray(values[name]) || values[name] ? (
              <Typography color="primary">
                {Array.isArray(values[name]) ? values[name].length : 1} file
                selected
              </Typography>
            ) : isDragActive ? (
              <Typography color="primary">Drop here...</Typography>
            ) : (
              <Button startIcon={<Upload />}>Click to upload your file</Button>
            )}
          </div>
          {errors[0] && (
            <FormHelperText className="text-red-600">
              {errors[0]}
            </FormHelperText>
          )}
        </>
      )}
    </Dropzone>
  );
};
