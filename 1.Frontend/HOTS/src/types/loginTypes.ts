
import { Dispatch, SetStateAction } from 'react';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface BaseLoginProps {
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  credentials: LoginCredentials;
  setCredentials: Dispatch<SetStateAction<LoginCredentials>>;
  setForgotToggle: Dispatch<SetStateAction<boolean>>;
  setLockedAccount: Dispatch<SetStateAction<boolean>>;
}

export interface ForgotpassformProps {
  setForgotToggle: Dispatch<SetStateAction<boolean>>;
  setRecoveryToggle: Dispatch<SetStateAction<boolean>>;
}

export interface RecoveryformProps {
  setRecoveryToggle: Dispatch<SetStateAction<boolean>>;
  setForgotToggle: Dispatch<SetStateAction<boolean>>;
}

export interface LockedaccountProps extends BaseLoginProps {}
