
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, FileText, CheckSquare, MessageSquare, Clock } from 'lucide-react';

const UserGuide = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">FAQ & Help</h1>
            <p className="text-muted-foreground">Everything you need to know about using HOTS</p>
          </div>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="updates">Chat with us</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I submit a new service request?</AccordionTrigger>
                    <AccordionContent>
                      Go to the Service Catalog, select the service you need, fill out the required form fields, and click Submit. You'll receive a confirmation with your ticket number.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How can I track my requests?</AccordionTrigger>
                    <AccordionContent>
                      Visit the "My Tickets" page to see all your submitted requests, their current status, and any updates from the support team.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>What do the different ticket statuses mean?</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><Badge variant="secondary">Pending</Badge> - Request submitted, waiting for review</li>
                        <li><Badge variant="default">Waiting Approval</Badge> - Being worked on by support team</li>
                        <li><Badge variant="outline">Waiting for Approval</Badge> - Requires manager approval</li>
                        <li><Badge variant="destructive">Rejected</Badge> - Request denied with reason</li>
                        <li><Badge variant="default">Completed</Badge> - Request fulfilled</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger>How do I approve requests in my task list?</AccordionTrigger>
                    <AccordionContent>
                      Check your Task List for pending approvals. Click on any item to review details, then use the Approve/Reject buttons. You can add comments to explain your decision.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Can I edit a request after submitting?</AccordionTrigger>
                    <AccordionContent>
                      Once submitted, requests cannot be edited directly. If changes are needed, contact the support team through the ticket comments or submit a new request.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          

          <TabsContent value="updates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
               
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
};

export default UserGuide;
