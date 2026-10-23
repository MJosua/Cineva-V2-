
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
// import { AppLayout } from '@/components/layout/AppLayout';
import { Search, BookOpen, Video, FileText, MessageCircle, Star, Clock, Users, ArrowRight, MessageSquare, HelpCircle, CheckSquare, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import axios from 'axios';
import { API_URL } from '../config/sourceConfig';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Icons mapping for CMS categories
  const iconMap: { [key: string]: React.ElementType } = {
    'BookOpen': BookOpen,
    'FileText': FileText,
    'Users': Users,
    'MessageCircle': MessageCircle,
    'ShieldCheck': ShieldAlert,
    'HelpCircle': HelpCircle,
    'Clock': Clock
  };

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          axios.get(`${API_URL}/cms/posts?module_key=guide`),
          axios.get(`${API_URL}/cms/categories`)
        ]);

        if (postsRes.data.ok) setPosts(postsRes.data.pages || postsRes.data.data);
        if (catsRes.data.ok) setCategories(catsRes.data.data);
      } catch (err) {
        console.error("Failed to fetch CMS content", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-50/50 to-slate-50 rounded-lg border border-blue-100/50">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-sm">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">User Guide</h1>
        <p className="text-lg text-gray-500 mb-8 font-medium">Step-by-step instructions and platform documentation</p>
      </div>

      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="grid w-full grid-cols-5 p-1 bg-slate-100/50 rounded-xl">
          <TabsTrigger value="updates" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">Articles</TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">Tickets</TabsTrigger>
          <TabsTrigger value="approval" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">Approval</TabsTrigger>
          <TabsTrigger value="meeting-room" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">Meeting Room</TabsTrigger>
          <TabsTrigger value="guide" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">Quick Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Card key={post.page_id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-slate-200">
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
                      System Update
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 flex gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                      {post.summary}
                    </p>
                    <Button variant="ghost" asChild className="p-0 h-auto text-blue-600 font-bold text-xs hover:bg-transparent hover:text-blue-800 flex items-center gap-1">
                      <Link to={`/page/${post.slug}`}>
                        Read Details
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                  {post.thumbnail && (
                    <div className="shrink-0">
                      <div className="w-20 h-20 rounded-lg border-2 border-white shadow-md overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                        <img 
                          src={post.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

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

        <TabsContent value="meeting-room" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                Meeting Room Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-blue-700">
                    <BookOpen className="w-5 h-5" />
                    1. Booking a Room
                  </h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-600">
                    <li>Navigate to <strong>Service Catalog</strong> and select <strong>Meeting Room Booking</strong>.</li>
                    <li>Use the <strong>Gantt Chart</strong> to view real-time room availability.</li>
                    <li>Simply <strong>drag or click</strong> on an available time slot.</li>
                    <li>Fill in the purpose and PIC details to confirm your reservation.</li>
                  </ol>
                </div>

                <div className="bg-white p-4 rounded-xl border-l-4 border-l-green-500 shadow-sm">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-green-700">
                    <FileText className="w-5 h-5" />
                    2. Web Modification
                  </h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-600">
                    <li>Find your booking block in the Gantt view (highlighted in <strong>Dark Blue</strong>).</li>
                    <li>Click the block to open the modification menu.</li>
                    <li>Select <strong>Edit Time</strong> to extend (limit based on the next entry).</li>
                    <li>Select <strong>Cancel Booking</strong> to release the room instantly.</li>
                  </ol>
                </div>
              </div>

              <Card className="bg-slate-50 border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-3 px-5 flex items-center gap-3">
                  <Users className="w-5 h-5 text-white" />
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                    3. Kiosk / Tablet Experience
                  </h4>
                </div>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-6">
                    Designed for tablets located outside meeting rooms for immediate onsite actions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <p className="font-bold text-[10px] uppercase text-slate-400 mb-2 tracking-widest">Security Protocol</p>
                      <p className="text-sm leading-relaxed text-slate-700">Modification requires the <strong>PIC Password</strong>. All onsite changes are logged for accountability.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <p className="font-bold text-[10px] uppercase text-slate-400 mb-2 tracking-widest">Verification</p>
                      <p className="text-sm leading-relaxed text-slate-700">The <strong>PIC Name</strong> is clearly displayed on the card to ensure the correct owner is performing the action.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpCenter;
