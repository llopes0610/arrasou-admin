import {
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CreateProfessionalBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;

  defaultCommission?: number;
};

/*
 * ============================================================
 * POST /api/professionals
 *
 * Cria:
 *
 * auth.users
 *      ↓ trigger
 * profiles
 *      ↓
 * professionals
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    /*
     * ========================================================
     * VALIDAR USUÁRIO LOGADO
     * ========================================================
     */

    const supabase =
      await createClient();

    const {
      data: claimsData,
      error: claimsError,
    } =
      await supabase.auth.getClaims();

    const userId =
      claimsData?.claims?.sub;

    if (
      claimsError ||
      !userId
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ========================================================
     * VALIDAR ADMIN
     * ========================================================
     */

    const {
      data: profile,
      error: profileError,
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
      profileError ||
      !profile ||
      !profile.active ||
      profile.role !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para criar profissionais.",
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
      ) as CreateProfessionalBody;

    const name =
      body.name?.trim();

    const email =
      body.email
        ?.trim()
        .toLowerCase();

    const password =
      body.password;

    const phone =
      body.phone?.trim() ||
      null;

    const commission =
      Number(
        body.defaultCommission ??
          0
      );

    /*
     * ========================================================
     * VALIDAÇÕES
     * ========================================================
     */

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Informe o nome da profissional.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Informe o e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !password ||
      password.length < 6
    ) {
      return NextResponse.json(
        {
          error:
            "A senha deve possuir pelo menos 6 caracteres.",
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
            "A comissão deve estar entre 0 e 100.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * CLIENT ADMIN
     * ========================================================
     */

    const adminSupabase =
      createAdminClient();

    /*
     * ========================================================
     * AUTH USER
     * ========================================================
     */

    const {
      data: authData,
      error: authError,
    } =
      await adminSupabase
        .auth
        .admin
        .createUser({
          email,

          password,

          email_confirm:
            true,

          user_metadata: {
            full_name:
              name,
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        "Erro Auth:",
        authError
      );

      return NextResponse.json(
        {
          error:
            authError?.message ??
            "Não foi possível criar o usuário.",
        },
        {
          status: 400,
        }
      );
    }

    const newUserId =
      authData.user.id;

    try {
      /*
       * O trigger handle_new_user()
       * cria profiles automaticamente.
       *
       * Ainda assim fazemos UPSERT para
       * garantir os valores corretos.
       */

      const {
        error:
          profileInsertError,
      } =
        await adminSupabase
          .from("profiles")
          .upsert({
            id:
              newUserId,

            full_name:
              name,

            role:
              "professional",

            active:
              true,
          });

      if (
        profileInsertError
      ) {
        throw profileInsertError;
      }

      /*
       * ======================================================
       * PROFESSIONAL
       * ======================================================
       */

      const {
        data:
          professional,

        error:
          professionalError,
      } =
        await adminSupabase
          .from(
            "professionals"
          )
          .insert({
            profile_id:
              newUserId,

            display_name:
              name,

            phone,

            default_commission_percentage:
              commission,

            active:
              true,
          })
          .select(`
            id,
            profile_id,
            display_name,
            phone,
            default_commission_percentage,
            active
          `)
          .single();

      if (
        professionalError
      ) {
        throw professionalError;
      }

      return NextResponse.json(
        {
          professional,
        },
        {
          status: 201,
        }
      );
    } catch (
      databaseError
    ) {
      /*
       * Se Auth foi criado mas o cadastro
       * interno falhou, removemos o usuário
       * para não deixar registro órfão.
       */

      await adminSupabase
        .auth
        .admin
        .deleteUser(
          newUserId
        );

      console.error(
        "Erro ao criar profissional:",
        databaseError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir o cadastro da profissional.",
        },
        {
          status: 500,
        }
      );
    }
  } catch (
    error
  ) {
    console.error(
      "Erro POST professionals:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao cadastrar profissional.",
      },
      {
        status: 500,
      }
    );
  }
}