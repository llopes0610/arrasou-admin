import AdminShell from "@/components/layout/AdminShell";

import {
  getCurrentProfile,
} from "@/lib/auth/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile =
    await getCurrentProfile();

  return (
    <AdminShell
      userName={
        profile.full_name ??
        "Usuário"
      }
      userRole={
        profile.role
      }
      accessScope={
        profile.access_scope
      }
    >
      {children}
    </AdminShell>
  );
}