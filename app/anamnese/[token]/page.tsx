import {
  notFound,
} from "next/navigation";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import AnamnesisPublicForm from "@/components/anamnese/AnamnesisPublicForm";

type PageProps = {
  params:
    Promise<{
      token: string;
    }>;
};

export default async function AnamnesisPage({
  params,
}: PageProps) {
  const {
    token,
  } =
    await params;

  const supabase =
    createAdminClient();

  const {
    data:
      request,
  } =
    await supabase
      .from(
        "anamnesis_requests"
      )
      .select(`
        id,
        status,
        expires_at,

        clients (
          id,
          full_name,
          phone
        )
      `)
      .eq(
        "token",
        token
      )
      .maybeSingle();

  if (!request) {
    notFound();
  }

  const client =
    Array.isArray(
      request.clients
    )
      ? request.clients[0] ??
        null
      : request.clients;

  const expired =
    new Date(
      request.expires_at
    ).getTime() <
    Date.now();

  if (
    request.status !==
      "pending" ||
    expired
  ) {
    return (
      <main
        className="
          flex
          min-h-dvh
          items-center
          justify-center
          bg-[#F7F6F2]
          px-4
          py-10
        "
      >
        <div
          className="
            w-full
            max-w-lg
            rounded-3xl
            border
            border-black/10
            bg-white
            p-8
            text-center
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-[#C9A227]/10
              font-serif
              text-lg
              font-bold
              text-[#C9A227]
            "
          >
            AS
          </div>

          <h1
            className="
              mt-6
              font-serif
              text-2xl
              font-semibold
              text-[#111]
            "
          >
            Ficha indisponível
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-black/45
            "
          >
            {request.status ===
            "completed"
              ? "Esta ficha de anamnese já foi preenchida."
              : request.status ===
                  "canceled"
                ? "Esta ficha foi cancelada pelo Studio."
                : "O link desta ficha expirou."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <AnamnesisPublicForm
      token={
        token
      }
      initialClient={{
        fullName:
          client?.full_name ??
          "",

        phone:
          client?.phone ??
          "",
      }}
    />
  );
}