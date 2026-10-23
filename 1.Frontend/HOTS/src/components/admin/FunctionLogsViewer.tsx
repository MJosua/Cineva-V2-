import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchFunctionLogs, fetchGeneratedDocuments } from '@/store/slices/customFunctionSlice';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/sourceConfig';

export default function FunctionLogsViewer() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { functionLogs, generatedDocuments, isLoading } = useAppSelector(state => state.customFunction);

  const [ticketId, setTicketId] = useState('');

  const handleLoadLogs = async () => {
    if (!ticketId) {
      toast({
        title: "Error",
        description: "Please enter a ticket ID",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(fetchFunctionLogs(parseInt(ticketId))).unwrap();
      await dispatch(fetchGeneratedDocuments(parseInt(ticketId))).unwrap();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to load logs",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleDownloadDocument = (documentId: number | string) => {
    // Convert to number if it's a string
    const docId = typeof documentId === 'string' ? parseInt(documentId) : documentId;
    window.open(`${API_URL}/hots/generateddocuments/${docId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Enter Ticket ID"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleLoadLogs} disabled={isLoading}>
          Load Logs & Documents
        </Button>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Function Logs</TabsTrigger>
          <TabsTrigger value="documents">Generated Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {functionLogs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No function logs found. Enter a ticket ID and click "Load Logs & Documents" to view execution logs.
              </CardContent>
            </Card>
          ) : (
            functionLogs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <CardTitle className="text-lg">{log.function_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {log.trigger_event}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Executed:</span>
                      <span>{new Date(log.execution_time).toLocaleString()}</span>
                    </div>
                    {log.error_message && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700 font-medium">Error:</p>
                        <p className="text-sm text-red-600">{log.error_message}</p>
                      </div>
                    )}
                    {log.result_data && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium mb-2">Result Data:</p>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(log.result_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {generatedDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No generated documents found. Enter a ticket ID and click "Load Logs & Documents" to view generated documents.
              </CardContent>
            </Card>
          ) : (
            generatedDocuments.map((document) => (
              <Card key={document.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{document.file_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Type: {document.document_type}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(document.file_name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Generated:</span>
                    <span>{new Date(document.generated_date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Template:</span>
                    <span>{document.template_used}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
