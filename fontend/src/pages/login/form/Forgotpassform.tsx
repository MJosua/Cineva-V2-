import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MailQuestion } from 'lucide-react';
import { ForgotpassformProps } from '@/types/loginTypes';
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_URL } from "../../../config/sourceConfig";

const Forgotpassform = ({ setForgotToggle, setRecoveryToggle }: ForgotpassformProps) => {
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (!domain || localPart.length <= 2) return email;
    const masked = localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    return `${masked}@${domain}`;
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: "Oops!",
        description: "User ID can't be empty!",
        duration: 6000,
      });
      return;
    }

    axios.post(`${API_URL}/hots_auth/forgot/`, { uid: username.trim() })
      .then((res) => {
        if (!res.data.success) {
          setError(res?.data?.message ?? "An error occurred");
          setSuccess(false);
        } else {
          setEmail(res?.data?.email ?? "");
          setSuccess(true);
        }
      })
      .catch(() => {
        toast({
          title: "Oops!",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
          duration: 6000,
        });
      });
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <MailQuestion className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {success ? "Check Your Inbox" : "Forgot Password"}
          </CardTitle>
          {success ? (
            <p className="text-gray-600 mt-2">
              A password reset link has been sent to the email address:
              <br />
              {maskEmail(email)}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Enter your username to receive password reset instructions.
              </p>
              <p className="text-sm text-gray-500">Helpdesk and Operational Tracking System</p>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!success ? (
          <>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="username">Username / Employee ID</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                Send Reset Instructions
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => setForgotToggle(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-500">
            <a
              href=""
              onClick={(e) => {
                e.preventDefault();
                setForgotToggle(false);
              }}
              className="hover:underline hover:text-blue-900"
            >
              Back to Login
            </a>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>For technical support, contact IT Department</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Forgotpassform;
