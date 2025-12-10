
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { Search, BookOpen, Video, FileText, MessageCircle, Star, Clock, Users, ArrowRight, MessageSquare, HelpCircle, CheckSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularArticles = [
    {
      title: "How to Submit a Service Request",
      description: "Learn how to create and submit service requests through the system",
      category: "Getting Started",
      readTime: "3 min",
      rating: 4.8,
      views: 1250
    },
    {
      title: "Understanding Approval Workflows",
      description: "Guide to understanding how approval processes work in the system",
      category: "Workflows",
      readTime: "5 min",
      rating: 4.6,
      views: 890
    },
    {
      title: "Managing Your Tickets",
      description: "How to track, update, and manage your submitted tickets",
      category: "Ticket Management",
      readTime: "4 min",
      rating: 4.9,
      views: 1100
    },
    {
      title: "File Upload Guidelines",
      description: "Best practices for uploading files and attachments",
      category: "Files & Attachments",
      readTime: "2 min",
      rating: 4.5,
      views: 670
    }
  ];

  const categories = [
    {
      name: "Getting Started",
      description: "Basic guides to help you get up and running",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700",
      articleCount: 12
    },
    {
      name: "Service Requests",  
      description: "Everything about creating and managing service requests",
      icon: FileText,
      color: "bg-green-100 text-green-700",
      articleCount: 18
    },
    {
      name: "Approval Workflows",
      description: "Understanding approval processes and workflows",
      icon: Users,
      color: "bg-purple-100 text-purple-700",
      articleCount: 8
    },
    {
      name: "Troubleshooting",
      description: "Common issues and how to resolve them",
      icon: MessageCircle,
      color: "bg-orange-100 text-orange-700",
      articleCount: 15
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 mb-8">Find answers, guides, and support for all your questions</p>
          
          
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="guide">Quick Guide</TabsTrigger>
          </TabsList>

          

          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Working with Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Creating a Ticket</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Navigate to Service Catalog</li>
                    <li>Choose the appropriate service category</li>
                    <li>Fill all required fields (marked with *)</li>
                    <li>Attach any necessary files</li>
                    <li>Review your information and submit</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Ticket Details Page</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Status Timeline:</strong> See request progress</li>
                    <li><strong>Comments:</strong> Communicate with support team</li>
                    <li><strong>Attachments:</strong> View uploaded files</li>
                    <li><strong>Approval Flow:</strong> Track approval status</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Communication</h4>
                  <p>Use the comments section to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide additional information</li>
                    <li>Ask questions about your request</li>
                    <li>Respond to support team queries</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Approval Process Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Understanding Approvals</h4>
                  <p>Some requests require approval from managers or department heads before processing. The approval workflow is automatic based on:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Request type and value</li>
                    <li>Your department and role</li>
                    <li>Company policies</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">For Approvers</h4>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Check your Task List regularly for pending approvals</li>
                    <li>Click on requests to review full details</li>
                    <li>Consider business impact and policy compliance</li>
                    <li>Approve or reject with clear comments</li>
                    <li>Escalate complex decisions if needed</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Approval Statuses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <Badge variant="secondary" className="mb-2">Pending</Badge>
                      <p className="text-sm">Waiting for approver action</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="default" className="mb-2">Approved</Badge>
                      <p className="text-sm">Request approved, processing continues</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="destructive" className="mb-2">Rejected</Badge>
                      <p className="text-sm">Request denied, see comments for reason</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Badge variant="outline" className="mb-2">Escalated</Badge>
                      <p className="text-sm">Sent to higher authority</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          

          <TabsContent value="guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Submit Request
                    </h4>
                    <ol className="text-sm space-y-1">
                      <li>1. Go to Service Catalog</li>
                      <li>2. Select service type</li>
                      <li>3. Fill required fields</li>
                      <li>4. Submit request</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Handle Approvals
                    </h4>
                    <ol className="text-sm space-y-1">
                      <li>1. Check Task List</li>
                      <li>2. Review request details</li>
                      <li>3. Approve or reject</li>
                      <li>4. Add comments</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Track Progress
                    </h4>
                    <ol className="text-sm space-y-1">
                      <li>1. Visit My Tickets</li>
                      <li>2. Click on ticket</li>
                      <li>3. View status updates</li>
                      <li>4. Add comments if needed</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Get Help
                    </h4>
                    <ol className="text-sm space-y-1">
                      <li>1. Check this guide</li>
                      <li>2. Contact IT support</li>
                      <li>3. Ask your manager</li>
                      <li>4. Submit help request</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-800">Still need help?</h3>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Contact Support</Button>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">Schedule a Call</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default HelpCenter;
