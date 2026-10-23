
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { RecoveryformProps } from '@/types/loginTypes';

const Recoveryform = ({ setRecoveryToggle, setForgotToggle }: RecoveryformProps) => {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">Password Recovery</CardTitle>
          <p className="text-sm text-gray-500">
            Check your email for recovery instructions
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-gray-600">
          <p>We've sent password recovery instructions to your email address.</p>
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setRecoveryToggle(false);
            setForgotToggle(false);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
      </CardContent>
    </Card>
  );
};

export default Recoveryform;
