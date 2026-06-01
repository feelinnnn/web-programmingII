import AuthLayout from '../../../components/auth/AuthLayout';
import RegisterForm from '../../../components/auth/RegisterForm';
import PanelContent from '../../../components/auth/PanelContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account | CookCult',
  description: 'Join the CookCult community to share and discover amazing recipes.'
};

export default function RegisterPage() {
  return (
    <AuthLayout
      panelSide="left"
      panelContent={
        <PanelContent
          title={"Get\nStarted!"}
          linkLabel="Already have an account?"
          link={{
            href: '/auth-app/login',
            text: 'Sign in',
          }}
        />
      }
      formContent={<RegisterForm />}
    />
  );
}
