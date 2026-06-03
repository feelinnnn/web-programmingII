import AuthLayout from '../../../components/auth/AuthLayout';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';
import PanelContent from '../../../components/auth/PanelContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | CookCult',
  description: 'Set a new password.',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      panelSide="right"
      panelContent={
        <PanelContent
          title={"New\nPassword"}
          subtitle="Almost done!"
          linkLabel="Back to Login?"
          link={{
            href: '/auth-app/login',
            text: 'Login',
          }}
        />
      }
      formContent={<ResetPasswordForm />}
    />
  );
}
