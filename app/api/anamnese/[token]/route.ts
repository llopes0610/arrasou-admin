import {
  NextResponse,
} from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

type RouteContext = {
  params:
    Promise<{
      token: string;
    }>;
};

type AnamnesisPayload = {
  fullName?: string;

  cpf?: string;
  rg?: string;

  birthDate?:
    | string
    | null;

  phone?: string;
  email?: string;

  address?: string;
  city?: string;
  cep?: string;

  howDidYouFindUs?: string;

  smoker?:
    boolean;

  pregnant?:
    boolean;

  breastfeeding?:
    boolean;

  hypertension?:
    boolean;

  diabetes?:
    boolean;

  allergies?:
    boolean;

  herpes?:
    boolean;

  heartDisease?:
    boolean;

  anemia?:
    boolean;

  glaucoma?:
    boolean;

  hepatitis?:
    boolean;

  autoimmuneDisease?:
    boolean;

  roaccutane?:
    boolean;

  epilepsy?:
    boolean;

  hiv?:
    boolean;

  skinProblems?:
    boolean;

  keloids?:
    boolean;

  oncologicalHistory?:
    boolean;

  continuousMedication?:
    boolean;

  otherHealthProblem?:
    string;

  procedureType?:
    string;

  imageAuthorized?:
    boolean;

  acceptedTerms?:
    boolean;

  clientSignature?:
    string;
};

/*
 * ============================================================
 * GET
 *
 * Valida o token e devolve somente
 * os dados necessários para a ficha pública.
 * ============================================================
 */

export async function GET(
  request:
    Request,
  context:
    RouteContext
) {
  try {
    const {
      token,
    } =
      await context.params;

    const supabase =
      createAdminClient();

    const {
      data:
        anamnesisRequest,
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

    if (
      error ||
      !anamnesisRequest
    ) {
      return NextResponse.json(
        {
          error:
            "Ficha não encontrada.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      anamnesisRequest.status ===
      "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta ficha já foi preenchida.",
          code:
            "completed",
        },
        {
          status:
            409,
        }
      );
    }

    if (
      anamnesisRequest.status ===
      "canceled"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta ficha foi cancelada.",
          code:
            "canceled",
        },
        {
          status:
            410,
        }
      );
    }

    const expiresAt =
      new Date(
        anamnesisRequest.expires_at
      );

    if (
      expiresAt.getTime() <
      Date.now()
    ) {
      await supabase
        .from(
          "anamnesis_requests"
        )
        .update({
          status:
            "expired",
        })
        .eq(
          "id",
          anamnesisRequest.id
        );

      return NextResponse.json(
        {
          error:
            "Este link expirou.",
          code:
            "expired",
        },
        {
          status:
            410,
        }
      );
    }

    const client =
      Array.isArray(
        anamnesisRequest.clients
      )
        ? anamnesisRequest
            .clients[0] ??
          null
        : anamnesisRequest.clients;

    return NextResponse.json({
      id:
        anamnesisRequest.id,

      client: {
        id:
          client?.id ??
          null,

        fullName:
          client?.full_name ??
          "",

        phone:
          client?.phone ??
          "",
      },

      expiresAt:
        anamnesisRequest
          .expires_at,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro ao validar anamnese:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar a ficha.",
      },
      {
        status:
          500,
      }
    );
  }
}


/*
 * ============================================================
 * POST
 *
 * Recebe e grava a ficha.
 * ============================================================
 */

export async function POST(
  request:
    Request,
  context:
    RouteContext
) {
  try {
    const {
      token,
    } =
      await context.params;

    const body =
      (
        await request.json()
      ) as AnamnesisPayload;

    /*
     * ========================================================
     * VALIDAÇÕES BÁSICAS
     * ========================================================
     */

    if (
      !body.fullName?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Informe seu nome completo.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !body.phone?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Informe seu telefone.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !body.acceptedTerms
    ) {
      return NextResponse.json(
        {
          error:
            "É necessário aceitar o termo de responsabilidade.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !body.clientSignature
        ?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Informe sua assinatura.",
        },
        {
          status:
            400,
        }
      );
    }

    const supabase =
      createAdminClient();

    /*
     * ========================================================
     * LOCALIZA SOLICITAÇÃO
     * ========================================================
     */

    const {
      data:
        anamnesisRequest,
      error:
        requestError,
    } =
      await supabase
        .from(
          "anamnesis_requests"
        )
        .select(`
          id,
          client_id,
          appointment_id,
          status,
          expires_at
        `)
        .eq(
          "token",
          token
        )
        .maybeSingle();

    if (
      requestError ||
      !anamnesisRequest
    ) {
      return NextResponse.json(
        {
          error:
            "Ficha não encontrada.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
     * ========================================================
     * STATUS
     * ========================================================
     */

    if (
      anamnesisRequest.status !==
      "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta ficha não está mais disponível para preenchimento.",
        },
        {
          status:
            409,
        }
      );
    }

    /*
     * ========================================================
     * EXPIRAÇÃO
     * ========================================================
     */

    if (
      new Date(
        anamnesisRequest
          .expires_at
      ).getTime() <
      Date.now()
    ) {
      await supabase
        .from(
          "anamnesis_requests"
        )
        .update({
          status:
            "expired",
        })
        .eq(
          "id",
          anamnesisRequest.id
        );

      return NextResponse.json(
        {
          error:
            "Este link expirou.",
        },
        {
          status:
            410,
        }
      );
    }

    /*
     * ========================================================
     * AUDITORIA
     * ========================================================
     */

    const forwardedFor =
      request.headers.get(
        "x-forwarded-for"
      );

    const ipAddress =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ??
      request.headers.get(
        "x-real-ip"
      ) ??
      null;

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    /*
     * ========================================================
     * GRAVA FICHA
     * ========================================================
     */

    const {
      error:
        insertError,
    } =
      await supabase
        .from(
          "anamnesis_forms"
        )
        .insert({
          request_id:
            anamnesisRequest.id,

          client_id:
            anamnesisRequest
              .client_id,

          appointment_id:
            anamnesisRequest
              .appointment_id,

          full_name:
            body.fullName
              .trim(),

          cpf:
            cleanNullable(
              body.cpf
            ),

          rg:
            cleanNullable(
              body.rg
            ),

          birth_date:
            body.birthDate ||
            null,

          phone:
            cleanNullable(
              body.phone
            ),

          email:
            cleanNullable(
              body.email
            ),

          address:
            cleanNullable(
              body.address
            ),

          city:
            cleanNullable(
              body.city
            ),

          cep:
            cleanNullable(
              body.cep
            ),

          how_did_you_find_us:
            cleanNullable(
              body.howDidYouFindUs
            ),

          smoker:
            body.smoker ??
            false,

          pregnant:
            body.pregnant ??
            false,

          breastfeeding:
            body.breastfeeding ??
            false,

          hypertension:
            body.hypertension ??
            false,

          diabetes:
            body.diabetes ??
            false,

          allergies:
            body.allergies ??
            false,

          herpes:
            body.herpes ??
            false,

          heart_disease:
            body.heartDisease ??
            false,

          anemia:
            body.anemia ??
            false,

          glaucoma:
            body.glaucoma ??
            false,

          hepatitis:
            body.hepatitis ??
            false,

          autoimmune_disease:
            body.autoimmuneDisease ??
            false,

          roaccutane:
            body.roaccutane ??
            false,

          epilepsy:
            body.epilepsy ??
            false,

          hiv:
            body.hiv ??
            false,

          skin_problems:
            body.skinProblems ??
            false,

          keloids:
            body.keloids ??
            false,

          oncological_history:
            body.oncologicalHistory ??
            false,

          continuous_medication:
            body.continuousMedication ??
            false,

          other_health_problem:
            cleanNullable(
              body.otherHealthProblem
            ),

          procedure_type:
            cleanNullable(
              body.procedureType
            ),

          image_authorized:
            body.imageAuthorized ??
            false,

          accepted_terms:
            true,

          client_signature:
            body.clientSignature
              .trim(),

          submitted_at:
            new Date()
              .toISOString(),

          ip_address:
            ipAddress,

          user_agent:
            userAgent,
        });

    if (
      insertError
    ) {
      console.error(
        "Erro ao salvar anamnese:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível salvar a ficha.",
        },
        {
          status:
            500,
        }
      );
    }

    /*
     * ========================================================
     * FINALIZA SOLICITAÇÃO
     * ========================================================
     */

    const {
      error:
        completeError,
    } =
      await supabase
        .from(
          "anamnesis_requests"
        )
        .update({
          status:
            "completed",

          completed_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          anamnesisRequest.id
        );

    if (
      completeError
    ) {
      console.error(
        "Ficha salva, mas erro ao finalizar solicitação:",
        completeError
      );
    }

    return NextResponse.json({
      success:
        true,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro inesperado na anamnese:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar a ficha.",
      },
      {
        status:
          500,
      }
    );
  }
}

function cleanNullable(
  value:
    | string
    | undefined
) {
  const cleaned =
    value?.trim();

  return cleaned ||
    null;
}