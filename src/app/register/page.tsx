import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return <RegisterClient googleEnabled={googleEnabled} />;
}
