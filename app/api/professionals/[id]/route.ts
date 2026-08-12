import {
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type UpdateProfessionalBody = {
  name?: string;

  phone?: string;

  defaultCommission?: number;

  active?: boolean;
};

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  {
    params,
  }: RouteProps
) {
  try {
    const {
      id,
    } =
      await params;

    /*
     * ========================================================
     * AUTORIZAÇÃO
     * ========================================================
     */

    const supabase =
      await createClient();

    const {
      data: claimsData,
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
          status: 401,
        }
      );
    }

    const {
      data: profile,
    } =
      await supabase
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
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * BODY
     * ========================================================
     */

    const body =
      (
        await request.json()
      ) as UpdateProfessionalBody;

    const name =
      body.name?.trim();

    const commission =
      Number(
        body.defaultCommission ??
          0
      );

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Informe o nome.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(
        commission
      ) ||
      commission < 0 ||
      commission > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Comissão inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const adminSupabase =
      createAdminClient();

    /*
     * ========================================================
     * BUSCAR PROFISSIONAL
     * ========================================================
     */

    const {
      data: professional,
      error:
        professionalError,
    } =
      await adminSupabase
        .from(
          "professionals"
        )
        .select(`
          id,
          profile_id
        `)
        .eq(
          "id",
          id
        )
        .single();

    if (
      professionalError ||
      !professional
    ) {
      return NextResponse.json(
        {
          error:
            "Profissional não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * PROFESSIONAL
     * ========================================================
     */

    const {
      error:
        updateError,
    } =
      await adminSupabase
        .from(
          "professionals"
        )
        .update({
          display_name:
            name,

          phone:
            body.phone?.trim() ||
            null,

          default_commission_percentage:
            commission,

          active:
            body.active ??
            true,
        })
        .eq(
          "id",
          id
        );

    if (updateError) {
      throw updateError;
    }

    /*
     * ========================================================
     * PROFILE
     * ========================================================
     */

    const {
      error:
        profileUpdateError,
    } =
      await adminSupabase
        .from(
          "profiles"
        )
        .update({
          full_name:
            name,

          active:
            body.active ??
            true,
        })
        .eq(
          "id",
          professional.profile_id
        );

    if (
      profileUpdateError
    ) {
      throw profileUpdateError;
    }

    return NextResponse.json({
      success:
        true,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro PATCH professional:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível atualizar a profissional.",
      },
      {
        status: 500,
      }
    );
  }
}