
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { uploadExcelFile } from '@/store/slices/customFunctionSlice';
import { useToast } from '@/hooks/use-toast';

interface ExcelUploaderProps {
  ticketId: number;
  onUploadComplete?: (result: any) => void;
}

export default function ExcelUploader({ ticketId, onUploadComplete }: ExcelUploaderProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isLoading } = useAppSelector(state => state.customFunction);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid File",
        description: "Please upload only Excel files (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await dispatch(uploadExcelFile({ ticketId, file })).unwrap();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      toast({
        title: "Success",
        description: "Excel file uploaded and processed successfully",
      });

      onUploadComplete?.(result);
    } catch (error: any) {
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error || "Failed to upload Excel file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Excel File Upload</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : uploadStatus === 'success'
              ? 'border-green-500 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadStatus === 'uploading' ? (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-primary animate-pulse" />
              <div>
                <p className="text-lg font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-medium text-green-700">Upload Successful!</p>
                <p className="text-sm text-muted-foreground">Excel file processed successfully</p>
              </div>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
              <div>
                <p className="text-lg font-medium text-red-700">Upload Failed</p>
                <p className="text-sm text-muted-foreground">Please try again</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-2">Supports .xlsx and .xls files</p>
              </div>
            </div>
          )}
        </div>
        
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="excel-upload"
          disabled={isLoading || uploadStatus === 'uploading'}
        />
        
        {uploadStatus !== 'uploading' && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => document.getElementById('excel-upload')?.click()}
              disabled={isLoading}
              variant={uploadStatus === 'success' ? 'outline' : 'default'}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadStatus === 'success' ? 'Upload Another File' : 'Choose File'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
