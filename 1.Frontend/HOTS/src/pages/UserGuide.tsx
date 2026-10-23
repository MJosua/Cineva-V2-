import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

const UserGuide = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUpdates = async () => {
      setLoading(true);
      
      // Fail-safe timeout to clear loading after 10s if network hangs
      const timeout = setTimeout(() => {
        if (isMounted) setLoading(false);
      }, 10000);

      try {
        const res = await axios.get(`${API_URL}/cms/posts?module_key=update`);
        if (isMounted && res.data.ok) {
          setPosts(res.data.pages || res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch updates:", err);
      } finally {
        clearTimeout(timeout);
        if (isMounted) setLoading(false);
      }
    };
    fetchUpdates();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center border border-green-200 shadow-sm">
          <HelpCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FAQ & Updates</h1>
          <p className="text-slate-500 font-medium">Everything you need to know about using HOTS</p>
        </div>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <TabsTrigger value="faq" className="data-[state=active]:bg-white rounded-lg">Frequently Asked Questions</TabsTrigger>
          <TabsTrigger value="updates" className="data-[state=active]:bg-white rounded-lg">System Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <HelpCircle className="w-5 h-5 text-green-500" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-slate-100">
                  <AccordionTrigger className="hover:text-green-600 transition-colors">How do I submit a new service request?</AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    Go to the Service Catalog, select the service you need, fill out the required form fields, and click Submit. You'll receive a confirmation with your ticket number.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-slate-100">
                  <AccordionTrigger className="hover:text-green-600 transition-colors">How can I track my requests?</AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    Visit the "My Tickets" page to see all your submitted requests, their current status, and any updates from the support team.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-slate-100">
                  <AccordionTrigger className="hover:text-green-600 transition-colors">What do the different ticket statuses mean?</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                       <div className="flex items-center gap-3 p-2 border rounded-lg">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">Pending</Badge>
                          <span className="text-xs text-slate-500">Waiting for review</span>
                       </div>
                       <div className="flex items-center gap-3 p-2 border rounded-lg border-blue-100 bg-blue-50/30">
                          <Badge className="bg-blue-500 border-none">Ongoing</Badge>
                          <span className="text-xs text-slate-500">Being worked on</span>
                       </div>
                       <div className="flex items-center gap-3 p-2 border rounded-lg border-amber-100 bg-amber-50/30">
                          <Badge className="bg-amber-500 border-none">Waiting</Badge>
                          <span className="text-xs text-slate-500">Requires manager approval</span>
                       </div>
                       <div className="flex items-center gap-3 p-2 border rounded-lg border-green-100 bg-green-50/30">
                          <Badge className="bg-green-500 border-none">Completed</Badge>
                          <span className="text-xs text-slate-500">Request fulfilled</span>
                       </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-slate-100">
                  <AccordionTrigger className="hover:text-green-600 transition-colors">How do I approve requests in my task list?</AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    Check your Task List for pending approvals. Click on any item to review details, then use the Approve/Reject buttons.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-blue-500" />
                Latest System Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-10 text-center text-slate-400">Loading updates...</div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.page_id} className="group relative pl-6 border-l-2 border-slate-100 hover:border-blue-500 transition-colors pb-6 last:pb-0">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 group-hover:scale-125 transition-all" />
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{post.title}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{post.summary}</p>
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 -ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Link to={`/page/${post.slug}`} className="flex items-center gap-1.5 text-xs font-bold">
                          View Details
                          <ArrowRight className="w-3 link-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                      No recent updates available.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserGuide;
