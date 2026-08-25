import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

type ActiveProfile = {
  id: string;
  role: "admin" | "professional" | string;
  active: boolean;
};

type ProfessionalRow = {
  id: string;
  profile_id: string;
};

async function getAuthenticatedContext() {
  const authClient =
    await createClient();

  const {
    data:
      claimsData,
  } =
    await authClient.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (!userId) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Não autenticado.",
          },
          {
            status:
              401,
          }
        ),
    };
  }

  const {
    data:
      profile,
  } =
    await authClient
      .from("profiles")
      .select(`
        id,
        role,
        active
      `)
      .eq(
        "id",
        userId
      )
      .maybeSingle();

  if (
    !profile ||
    !profile.active ||
    ![
      "admin",
      "professional",
    ].includes(
      profile.role
    )
  ) {
    return {
      error:
        NextResponse.json(
          {
            error:
              "Acesso negado.",
          },
          {
            status:
              403,
          }
        ),
    };
  }

  const adminClient =
    createAdminClient();

  let professional:
    ProfessionalRow | null =
      null;

  if (
    profile.role ===
    "professional"
  ) {
    const {
      data:
        professionalData,
    } =
      await adminClient
        .from(
          "professionals"
        )
        .select(`
          id,
          profile_id
        `)
        .eq(
          "profile_id",
          userId
        )
        .eq(
          "active",
          true
        )
        .maybeSingle();

    if (
      !professionalData
    ) {
      return {
        error:
          NextResponse.json(
            {
              error:
                "Profissional não vinculada.",
            },
            {
              status:
                403,
            }
          ),
      };
    }

    professional =
      professionalData as ProfessionalRow;
  }

  return {
    userId,
    profile:
      profile as ActiveProfile,
    professional,
    adminClient,
  };
}

async function canAccessAppointment(
  adminClient:
    ReturnType<typeof createAdminClient>,
  profile:
    ActiveProfile,
  professional:
    ProfessionalRow | null,
  appointmentId:
    string
) {
  if (
    profile.role ===
    "admin"
  ) {
    return true;
  }

  if (!professional) {
    return false;
  }

  const {
    data:
      appointment,
  } =
    await adminClient
      .from(
        "appointments"
      )
      .select(`
        id,
        professional_id
      `)
      .eq(
        "id",
        appointmentId
      )
      .maybeSingle();

  return (
    appointment
      ?.professional_id ===
    professional.id
  );
}

/* ============================================================
   GET

   Suporta:
   ?clientId=<uuid>
   ?appointmentId=<uuid>
   ?requestId=<uuid>&includeForm=true
============================================================ */

export async function GET(
  request:
    Request
) {
  try {
    const context =
      await getAuthenticatedContext();

    if (
      "error" in
      context
    ) {
      return context.error;
    }

    const {
      profile,
      professional,
      adminClient,
    } =
      context;

    const url =
      new URL(
        request.url
      );

    const clientId =
      url.searchParams.get(
        "clientId"
      );

    const appointmentId =
      url.searchParams.get(
        "appointmentId"
      );

    const requestId =
      url.searchParams.get(
        "requestId"
      );

    const includeForm =
      url.searchParams.get(
        "includeForm"
      ) ===
      "true";

    /*
     * ========================================================
     * DETALHE DE UMA FICHA PREENCHIDA
     * ========================================================
     */

    if (
      requestId &&
      includeForm
    ) {
      const {
        data:
          anamnesisRequest,
        error:
          requestError,
      } =
        await adminClient
          .from(
            "anamnesis_requests"
          )
          .select(`
            id,
            client_id,
            appointment_id,
            status
          `)
          .eq(
            "id",
            requestId
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

      if (
        profile.role !==
          "admin"
      ) {
        if (
          !anamnesisRequest
            .appointment_id
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

        const allowed =
          await canAccessAppointment(
            adminClient,
            profile,
            professional,
            anamnesisRequest
              .appointment_id
          );

        if (!allowed) {
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
      }

      const {
        data:
          form,
        error:
          formError,
      } =
        await adminClient
          .from(
            "anamnesis_forms"
          )
          .select(`
            id,
            request_id,
            client_id,
            appointment_id,

            full_name,
            cpf,
            rg,
            birth_date,
            phone,
            email,
            address,
            city,
            cep,
            how_did_you_find_us,

            smoker,
            pregnant,
            breastfeeding,
            hypertension,
            diabetes,
            allergies,
            herpes,
            heart_disease,
            anemia,
            glaucoma,
            hepatitis,
            autoimmune_disease,
            roaccutane,
            epilepsy,
            hiv,
            skin_problems,
            keloids,
            oncological_history,
            continuous_medication,
            other_health_problem,

            procedure_type,
            technique,
            pigment,
            needle_blade,
            phototype,
            skin_color,

            image_authorized,
            accepted_terms,
            client_signature,
            professional_signature,

            submitted_at,
            created_at
          `)
          .eq(
            "request_id",
            requestId
          )
          .maybeSingle();

      if (
        formError ||
        !form
      ) {
        return NextResponse.json(
          {
            error:
              "A ficha ainda não possui respostas preenchidas.",
          },
          {
            status:
              404,
          }
        );
      }

      return NextResponse.json({
        form,
      });
    }

    /*
     * ========================================================
     * LISTAGEM POR AGENDAMENTO
     * ========================================================
     */

    if (
      appointmentId
    ) {
      const allowed =
        await canAccessAppointment(
          adminClient,
          profile,
          professional,
          appointmentId
        );

      if (!allowed) {
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

      const {
        data,
        error,
      } =
        await adminClient
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
            "appointment_id",
            appointmentId
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        requests:
          data ?? [],
      });
    }

    /*
     * ========================================================
     * LISTAGEM POR CLIENTE
     * ========================================================
     */

    if (
      clientId
    ) {
      if (
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

      const {
        data,
        error,
      } =
        await adminClient
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
        throw error;
      }

      return NextResponse.json({
        requests:
          data ?? [],
      });
    }

    return NextResponse.json(
      {
        error:
          "Informe clientId, appointmentId ou requestId.",
      },
      {
        status:
          400,
      }
    );
  } catch (
    error
  ) {
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
}

/* ============================================================
   POST
   GERAR NOVA SOLICITAÇÃO

   body:
   {
     clientId,
     appointmentId?
   }
============================================================ */

export async function POST(
  request:
    Request
) {
  try {
    const context =
      await getAuthenticatedContext();

    if (
      "error" in
      context
    ) {
      return context.error;
    }

    const {
      userId,
      profile,
      professional,
      adminClient,
    } =
      context;

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

    if (
      !clientId
    ) {
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
      data:
        client,
      error:
        clientError,
    } =
      await adminClient
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
     * QUANDO VEM DO AGENDAMENTO
     * ========================================================
     */

    if (
      appointmentId
    ) {
      const {
        data:
          appointment,
        error:
          appointmentError,
      } =
        await adminClient
          .from(
            "appointments"
          )
          .select(`
            id,
            client_id,
            professional_id
          `)
          .eq(
            "id",
            appointmentId
          )
          .maybeSingle();

      if (
        appointmentError ||
        !appointment
      ) {
        return NextResponse.json(
          {
            error:
              "Agendamento não encontrado.",
          },
          {
            status:
              404,
          }
        );
      }

      if (
        appointment.client_id !==
        clientId
      ) {
        return NextResponse.json(
          {
            error:
              "O agendamento não pertence à cliente informada.",
          },
          {
            status:
              400,
          }
        );
      }

      if (
        profile.role !==
        "admin" &&
        appointment.professional_id !==
          professional?.id
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

      /*
       * Se já existe uma ficha concluída
       * para este atendimento, reaproveitamos.
       */
      const {
        data:
          completedRequest,
      } =
        await adminClient
          .from(
            "anamnesis_requests"
          )
          .select(`
            id,
            token,
            status,
            expires_at,
            completed_at
          `)
          .eq(
            "appointment_id",
            appointmentId
          )
          .eq(
            "status",
            "completed"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        completedRequest
      ) {
        return NextResponse.json({
          request: {
            id:
              completedRequest.id,
            token:
              completedRequest.token,
            status:
              completedRequest.status,
            expiresAt:
              completedRequest
                .expires_at,
            completedAt:
              completedRequest
                .completed_at,
            reused:
              true,
          },
        });
      }

      /*
       * Reaproveita somente um link pendente
       * do MESMO agendamento.
       */
      const {
        data:
          existingRequest,
      } =
        await adminClient
          .from(
            "anamnesis_requests"
          )
          .select(`
            id,
            token,
            status,
            expires_at,
            completed_at
          `)
          .eq(
            "appointment_id",
            appointmentId
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
          .limit(1)
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
            completedAt:
              existingRequest
                .completed_at,
            reused:
              true,
          },
        });
      }
    } else {
      /*
       * Cliente sem agendamento:
       * este fluxo continua restrito ao Admin.
       */
      if (
        profile.role !==
        "admin"
      ) {
        return NextResponse.json(
          {
            error:
              "A geração fora de um agendamento é permitida apenas ao administrador.",
          },
          {
            status:
              403,
          }
        );
      }

      const {
        data:
          existingRequest,
      } =
        await adminClient
          .from(
            "anamnesis_requests"
          )
          .select(`
            id,
            token,
            status,
            expires_at,
            completed_at
          `)
          .eq(
            "client_id",
            clientId
          )
          .is(
            "appointment_id",
            null
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
          .limit(1)
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
            completedAt:
              existingRequest
                .completed_at,
            reused:
              true,
          },
        });
      }
    }

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
      await adminClient
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
          expires_at,
          completed_at
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

        completedAt:
          created.completed_at,

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