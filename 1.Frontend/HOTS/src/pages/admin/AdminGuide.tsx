
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Settings, BookOpen, FileText, Workflow, Users, 
  ArrowRight, Clock, HelpCircle, Code, TestTube,
  ShieldCheck, AlertCircle, Info, CheckCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { DynamicForm } from '@/components/forms/DynamicForm';

const AdminGuide = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/cms/posts?module_key=admin_guide`);
        if (res.data.ok) setPosts(res.data.pages || res.data.data);
      } catch (err) {
        console.error("Failed to fetch Admin Guide content", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateSampleConfig = () => {
    const sampleConfig = {
      title: "Sample Service Form",
      description: "Example configuration",
      category: "IT Support",
      fields: [
        { label: 'Full Name', name: 'full_name', type: 'text', required: true, columnSpan: 2 },
        { label: 'Department', name: 'department', type: 'select', options: ['IT', 'HR'], required: true, columnSpan: 1 }
      ]
    };
    setGeneratedJson(JSON.stringify(sampleConfig, null, 2));
  };

  if (testMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Form Configuration Test</h1>
          <Button variant="outline" onClick={() => setTestMode(false)}>Back to Guide</Button>
        </div>
        <DynamicForm
          config={JSON.parse(generatedJson)}
          setConfig={() => {}}
          onSubmit={(data) => alert('Submitted: ' + JSON.stringify(data))}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Settings className="w-32 h-32" />
        </div>
        <h1 className="text-4xl font-extrabold mb-2">Systems Admin Guide</h1>
        <div className="flex justify-center gap-2 mb-4">
          <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-md">CMS DOCUMENTATION</Badge>
          <Badge className="bg-green-400/20 text-green-300 border-green-500/40 backdrop-blur-md">EXPERIMENTAL</Badge>
        </div>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">Master the HOTS ecosystem: Engine configurations, API builders, and automated workflows.</p>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="articles" className="py-2.5">Dynamic Updates</TabsTrigger>
          <TabsTrigger value="guides" className="py-2.5">Master Guide</TabsTrigger>
          <TabsTrigger value="config" className="py-2.5">Config Generator</TabsTrigger>
          <TabsTrigger value="troubleshooting" className="py-2.5">Troubleshooting</TabsTrigger>
        </TabsList>

        {/* 1. DYNAMIC ARTICLES */}
        <TabsContent value="articles" className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Card key={post.page_id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white shadow-sm ring-1 ring-slate-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold text-[10px]">LATEST GUIDE</Badge>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-2">{post.title}</CardTitle>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{post.summary}</p>
                    <Button variant="ghost" asChild className="p-0 h-auto text-blue-600 font-bold text-xs flex items-center gap-1">
                      <Link to={`/page/${post.slug}`}>
                        Open Documentation <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {posts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400">
                   <p>No admin guides found in CMS. Using static fallback logic...</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* 2. MASTER GUIDE (Restored Content) */}
        <TabsContent value="guides" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  System Setup & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-sm text-blue-800 mb-2">Initial Setup Sequence</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
                    <li>Verify Database Connection in `config/db.js`</li>
                    <li>Configure Redis/Cache settings for tracking</li>
                    <li>Sync Active Directory/LDAP if applicable</li>
                    <li>Initialize CMS categories and initial users</li>
                  </ol>
                </div>
                <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                  <h4 className="font-bold text-sm text-green-800 mb-2">Access Control (RBAC)</h4>
                  <p className="text-xs text-green-700 leading-relaxed">
                    Roles are assigned at the user level. Permissions are checked against the `module_key` in routes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Engine JSON Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                   <h4 className="font-bold text-sm text-slate-800 mb-2">Field Mapping Rules</h4>
                   <ul className="space-y-2 text-xs text-slate-600">
                     <li className="flex items-center gap-2"><Badge variant="outline">cstm_col1-15</Badge> Custom Fields</li>
                     <li className="flex items-center gap-2"><Badge variant="outline">lbl_col1-15</Badge> Display Labels</li>
                     <li className="flex items-center gap-2"><Badge variant="outline">workflow_id</Badge> Execution Path</li>
                   </ul>
                 </div>
                 <p className="text-xs text-slate-500 italic">Pro-Tip: Use the Config Generator tab to validate your JSON before saving to DB.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. CONFIG GENERATOR */}
        <TabsContent value="config" className="pt-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                Form JSON Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 font-mono text-[11px] text-blue-300 overflow-auto max-h-[400px]">
                <pre>{generatedJson || "// Click generate to see sample configuration or paste yours here"}</pre>
              </div>
              <div className="flex gap-2">
                <Button onClick={generateSampleConfig} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">Generate Sample</Button>
                <Button variant="outline" onClick={() => setTestMode(true)} disabled={!generatedJson} className="hover:bg-slate-50">
                  <TestTube className="w-4 h-4 mr-2" /> Live Test Canvas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. TROUBLESHOOTING (Restored Content) */}
        <TabsContent value="troubleshooting" className="space-y-6 pt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-100 bg-red-50/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Common Errors
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-red-700 space-y-2">
                  <p><strong>404 on API Routes:</strong> Ensure the module is registered in the main engine router.</p>
                  <p><strong>JSON Parse Error:</strong> Typically caused by unescaped quotes in the `content_json` column.</p>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-blue-50/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Info className="w-4 h-4" /> System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 space-y-2">
                  <p><strong>Logs:</strong> Check PM2 logs using `pm2 logs hots-api` on the VPS.</p>
                  <p><strong>Flush Cache:</strong> Run `REDIS-CLI FLUSHALL` to clear tracking heatmaps.</p>
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* Persistence and Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/cms" className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all group">
          <FileText className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-slate-800">CMS Fleet Manager</div>
          <p className="text-[11px] text-slate-500 mt-1">Manage articles for FAQ, Guides, and Admin pages.</p>
        </Link>
        <Link to="/admin/studio" className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all group">
          <Workflow className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-slate-800">Modular Studio</div>
          <p className="text-[11px] text-slate-500 mt-1">Design complex workflows and JSON-driven modules.</p>
        </Link>
        <Link to="/admin/settings" className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all group">
          <Settings className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-slate-800">System Core</div>
          <p className="text-[11px] text-slate-500 mt-1">Global constants, security keys, and API secrets.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminGuide;
