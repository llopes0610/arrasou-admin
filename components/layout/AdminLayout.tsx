import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "professional";
  active: boolean;
};

type AdminLayoutProps = {
  children: React.ReactNode;
  profile: Profile;
};

export default function AdminLayout({
  children,
  profile,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <AdminSidebar profile={profile} />

      <div
        className="
          min-h-screen

          lg:pl-[260px]
        "
      >
        <AdminHeader profile={profile} />

        <main
          className="
            px-4
            py-6

            sm:px-6

            lg:px-8
            lg:py-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}