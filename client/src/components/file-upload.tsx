import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: Record<string, string[]>;
  onFileSelect: (file: File) => void;
  file?: File | null;
}

export function FileUpload({ label, description, accept, onFileSelect, file }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {file && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>
      
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[120px]",
          isDragActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/50",
          file ? "border-green-200 bg-green-50/30" : ""
        )}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop file here..." : description || "Drag & drop or click to upload"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
