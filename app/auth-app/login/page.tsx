import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import PanelContent from '../../components/auth/PanelContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | CookCult',
  description: 'Sign in to access the community.',
}

export default function LoginPage() {
  return (
    <AuthLayout
      panelSide="right"
      panelContent={
        <PanelContent
          title={"Welcome\nBack!"}
          subtitle="Please enter your details"
          linkLabel="Don't you have an account?"
          linkHref="/register"
          linkText="Sign up"
        />
      }
      formContent={<LoginForm />}
    />
  );
}
