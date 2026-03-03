import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole } from 'lucide-react';

interface LockedaccountProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  credentials: {
    username: string;
    password: string;
  };
  setCredentials: (credentials: { username: string; password: string }) => void;
  setForgotToggle: (toggle: boolean) => void;
  setLockedAccount: (locked: boolean) => void;
}

const Lockedaccount = ({
  setForgotToggle,
  setLockedAccount,
}: LockedaccountProps) => {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center">
          <LockKeyhole className="text-white w-8 h-8" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">Your Account is Locked</CardTitle>
          <p className="text-sm text-gray-500">
            You have no remaining attempts.
            <br />
            Please go to the forgot password page to reset your credentials.
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-center mt-1">
          <Button
            variant="link"
            onClick={() => {
              setForgotToggle(false);
              setLockedAccount(false);
            }}
            className="text-blue-900"
          >
            Back to Login
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>For technical support, contact IT Department</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Lockedaccount;
