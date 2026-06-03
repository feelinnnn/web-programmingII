import AuthLayout from '../../../components/auth/AuthLayout';
import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm';
import PanelContent from '../../../components/auth/PanelContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | CookCult',
  description: 'Reset your password.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      panelSide="right"
      panelContent={
        <PanelContent
          title={"Recover\nAccount"}
          subtitle="Reset your password"
          linkLabel="Remember your password?"
          link={{
            href: '/auth-app/login',
            text: 'Login',
          }}
        />
      }
      formContent={<ForgotPasswordForm />}
    />
  );
}
