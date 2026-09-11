import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextRequest,
  NextResponse,
} from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function POST(
  request: NextRequest
) {
  const cookiesToSet: CookieToSet[] = [];

  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Informe seu e-mail." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Informe sua senha." },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(values) {
            values.forEach((cookie) => {
              cookiesToSet.push(cookie);
            });
          },
        },
      }
    );

    const {
      data,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      return withCookies(
        NextResponse.json(
          {
            error: getLoginErrorMessage(
              loginError.message
            ),
          },
          { status: 401 }
        ),
        cookiesToSet
      );
    }

    if (!data.user) {
      return withCookies(
        NextResponse.json(
          {
            error:
              "Não foi possível validar seu usuário.",
          },
          { status: 401 }
        ),
        cookiesToSet
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        access_scope,
        active
      `)
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();

      return withCookies(
        NextResponse.json(
          {
            error:
              "Seu usuário não está configurado no Arrasou Admin.",
          },
          { status: 403 }
        ),
        cookiesToSet
      );
    }

    if (!profile.active) {
      await supabase.auth.signOut();

      return withCookies(
        NextResponse.json(
          {
            error:
              "Seu acesso está inativo. Procure a administração do Studio.",
          },
          { status: 403 }
        ),
        cookiesToSet
      );
    }

    if (
      profile.role !== "admin" &&
      profile.role !== "professional"
    ) {
      await supabase.auth.signOut();

      return withCookies(
        NextResponse.json(
          {
            error:
              "Seu usuário não possui permissão para acessar este sistema.",
          },
          { status: 403 }
        ),
        cookiesToSet
      );
    }

    const redirectTo =
      profile.access_scope === "agenda_only"
        ? "/agenda"
        : "/dashboard";

    return withCookies(
      NextResponse.json({
        success: true,
        redirectTo,
      }),
      cookiesToSet
    );
  } catch (error) {
    console.error(
      "Erro inesperado no login:",
      error
    );

    return withCookies(
      NextResponse.json(
        {
          error:
            "Não foi possível entrar. Tente novamente.",
        },
        { status: 500 }
      ),
      cookiesToSet
    );
  }
}

function withCookies(
  response: NextResponse,
  cookies: CookieToSet[]
) {
  cookies.forEach(
    ({
      name,
      value,
      options,
    }) => {
      response.cookies.set(
        name,
        value,
        options as never
      );
    }
  );

  return response;
}

function getLoginErrorMessage(
  message: string
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "invalid login credentials"
    )
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    normalized.includes(
      "email not confirmed"
    )
  ) {
    return "Este e-mail ainda não foi confirmado.";
  }

  if (
    normalized.includes(
      "too many requests"
    )
  ) {
    return "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.";
  }

  return "Não foi possível entrar com esses dados.";
}
