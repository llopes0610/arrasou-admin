import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

/* ============================================================
   GET
   HISTÓRICO DE ANAMNESES DA CLIENTE
============================================================ */

export async function GET(
  request:
    Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data:
        claimsData,
    } =
      await supabase.auth.getClaims();

    const userId =
      claimsData?.claims?.sub;

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Não autenticado.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data:
        profile,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(`
          id,
          role,
          active
        `)
        .eq(
          "id",
          userId
        )
        .single();

    if (
      !profile ||
      !profile.active ||
      profile.role !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso negado.",
        },
        {
          status:
            403,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const clientId =
      url.searchParams.get(
        "clientId"
      );

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "Cliente não informado.",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "anamnesis_requests"
        )
        .select(`
          id,
          token,
          client_id,
          appointment_id,
          status,
          expires_at,
          completed_at,
          created_at
        `)
        .eq(
          "client_id",
          clientId
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) {
      console.error(
        "Erro ao carregar anamneses:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar as fichas.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json({
      requests:
        data ?? [],
    });
  } catch (
    error
  ) {
    console.error(
      "Erro inesperado:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar as fichas.",
      },
      {
        status:
          500,
      }
    );
  }
}


/* ============================================================
   POST
   GERAR NOVA SOLICITAÇÃO
============================================================ */

export async function POST(
  request:
    Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data:
        claimsData,
    } =
      await supabase.auth.getClaims();

    const userId =
      claimsData?.claims?.sub;

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Não autenticado.",
        },
        {
          status:
            401,
        }
      );
    }

    const {
      data:
        profile,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(`
          id,
          role,
          active
        `)
        .eq(
          "id",
          userId
        )
        .single();

    if (
      !profile ||
      !profile.active ||
      profile.role !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso negado.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json();

    const clientId =
      typeof body.clientId ===
      "string"
        ? body.clientId
        : "";

    const appointmentId =
      typeof body.appointmentId ===
      "string" &&
      body.appointmentId
        ? body.appointmentId
        : null;

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "Cliente não informado.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
     * ========================================================
     * VALIDAR CLIENTE
     * ========================================================
     */

    const {
      data:
        client,
      error:
        clientError,
    } =
      await supabase
        .from(
          "clients"
        )
        .select(`
          id,
          full_name,
          phone
        `)
        .eq(
          "id",
          clientId
        )
        .maybeSingle();

    if (
      clientError ||
      !client
    ) {
      return NextResponse.json(
        {
          error:
            "Cliente não encontrada.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
     * ========================================================
     * REAPROVEITAR LINK PENDENTE
     *
     * Evita gerar vários links ativos para a mesma cliente.
     * ========================================================
     */

    const {
      data:
        existingRequest,
    } =
      await supabase
        .from(
          "anamnesis_requests"
        )
        .select(`
          id,
          token,
          expires_at,
          status
        `)
        .eq(
          "client_id",
          clientId
        )
        .eq(
          "status",
          "pending"
        )
        .gt(
          "expires_at",
          new Date()
            .toISOString()
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          1
        )
        .maybeSingle();

    if (
      existingRequest
    ) {
      return NextResponse.json({
        request: {
          id:
            existingRequest.id,

          token:
            existingRequest.token,

          status:
            existingRequest.status,

          expiresAt:
            existingRequest
              .expires_at,

          reused:
            true,
        },
      });
    }

    /*
     * ========================================================
     * CRIAR SOLICITAÇÃO
     * ========================================================
     */

    const expiresAt =
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        7
    );

    const {
      data:
        created,
      error:
        insertError,
    } =
      await supabase
        .from(
          "anamnesis_requests"
        )
        .insert({
          client_id:
            clientId,

          appointment_id:
            appointmentId,

          status:
            "pending",

          expires_at:
            expiresAt
              .toISOString(),

          created_by:
            userId,
        })
        .select(`
          id,
          token,
          status,
          expires_at
        `)
        .single();

    if (
      insertError ||
      !created
    ) {
      console.error(
        "Erro ao gerar anamnese:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível gerar a ficha.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json({
      request: {
        id:
          created.id,

        token:
          created.token,

        status:
          created.status,

        expiresAt:
          created.expires_at,

        reused:
          false,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Erro inesperado ao gerar anamnese:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível gerar a ficha.",
      },
      {
        status:
          500,
      }
    );
  }
}