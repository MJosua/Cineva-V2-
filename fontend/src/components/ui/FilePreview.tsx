
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { API_URL } from '@/config/sourceConfig';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface FilePreviewProps {
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadDate?: string;
  generated?: boolean; // Add this property
  onDownload: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileName,
  filePath,
  fileUrl,
  fileSize,
  uploadDate,
  onDownload,
  generated = false
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFileTypeColor = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bg-blue-100 text-blue-800';
      case 'xlsx':
      case 'xls':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canPreview = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(ext);
  };

  const renderPreview = () => {
    const ext = getFileExtension(fileName);
    const previewUrl = fileUrl || filePath;
    if (!previewUrl) return <p>Preview not available</p>;

    if (ext === 'pdf' && generated === false) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-96"
          title={fileName}
        />
      );
    } else if (ext === 'pdf' && generated === true) {
      return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">

          <Viewer
            fileUrl={`${API_URL}/${filePath.replace(/\\/g, '/')}`}
          />
        </Worker>

      );

    }

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return (
        <img
          src={previewUrl}
          alt={fileName}
          className="max-w-full max-h-96 object-contain"
        />
      );
    }

    return <p>Preview not available for this file type</p>;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {getFileIcon(fileName)}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fileName}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className={getFileTypeColor(fileName)}>
              {getFileExtension(fileName).toUpperCase()}
            </Badge>
            {fileSize && (
              <span className="text-xs text-muted-foreground">
                {(fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
            {uploadDate && (
              <span className="text-xs text-muted-foreground">
                {new Date(uploadDate).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {canPreview(fileName) && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{fileName}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {renderPreview()}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
