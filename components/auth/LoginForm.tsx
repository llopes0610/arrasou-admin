"use client";

import {
    type FormEvent,
    useMemo,
    useState,
} from "react";

import {
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    LogIn,
    Mail,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
    const router =
        useRouter();

    const supabase =
        useMemo(
            () =>
                createClient(),
            []
        );

    const [
        email,
        setEmail,
    ] =
        useState("");

    const [
        password,
        setPassword,
    ] =
        useState("");

    const [
        showPassword,
        setShowPassword,
    ] =
        useState(false);

    const [
        loading,
        setLoading,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState("");

    /* ==========================================================
       LOGIN
    ========================================================== */

    async function handleSubmit(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

        if (
            !normalizedEmail
        ) {
            setError(
                "Informe seu e-mail."
            );

            return;
        }

        if (
            !password
        ) {
            setError(
                "Informe sua senha."
            );

            return;
        }

        setLoading(
            true
        );

        try {
            /*
             * Autenticação oficial Supabase.
             */
            const {
                data,
                error:
                loginError,
            } =
                await supabase.auth
                    .signInWithPassword({
                        email:
                            normalizedEmail,

                        password,
                    });

            if (
                loginError
            ) {
                console.error(
                    "Erro de login:",
                    loginError
                );

                setError(
                    getLoginErrorMessage(
                        loginError.message
                    )
                );

                return;
            }

            if (
                !data.user
            ) {
                setError(
                    "Não foi possível validar seu usuário."
                );

                return;
            }

            /*
             * ======================================================
             * VALIDAR PROFILE
             *
             * Não basta existir em auth.users.
             * Também precisa estar ativo no sistema.
             * ======================================================
             */

            const {
                data:
                profile,

                error:
                profileError,
            } =
                await supabase
                    .from(
                        "profiles"
                    )
                    .select(`
  id,
  role,
  access_scope,
  active
`)
                    .eq(
                        "id",
                        data.user.id
                    )
                    .single();

            if (
                profileError ||
                !profile
            ) {
                console.error(
                    "Perfil não encontrado:",
                    profileError
                );

                await supabase.auth.signOut();

                setError(
                    "Seu usuário não está configurado no Arrasou Admin."
                );

                return;
            }

            /*
             * Usuário inativo.
             */
            if (
                !profile.active
            ) {
                await supabase.auth.signOut();

                setError(
                    "Seu acesso está inativo. Procure a administração do Studio."
                );

                return;
            }

            /*
             * Somente perfis permitidos.
             */
            if (
                profile.role !==
                "admin" &&
                profile.role !==
                "professional"
            ) {
                await supabase.auth.signOut();

                setError(
                    "Seu usuário não possui permissão para acessar este sistema."
                );

                return;
            }

            /*
             * ======================================================
             * LOGIN CONCLUÍDO
             * ======================================================
             */

            if (
                profile.access_scope ===
                "agenda_only"
            ) {
                router.replace(
                    "/agenda"
                );
            } else {
                router.replace(
                    "/dashboard"
                );
            }

            router.refresh();

            router.refresh();
        } catch (
        loginException
        ) {
            console.error(
                "Erro inesperado no login:",
                loginException
            );

            setError(
                "Não foi possível entrar. Tente novamente."
            );
        } finally {
            setLoading(
                false
            );
        }
    }

    return (
        <form
            onSubmit={
                handleSubmit
            }
            className="
        space-y-5
      "
        >
            {/* ======================================================
          EMAIL
      ======================================================= */}

            <div>
                <label
                    htmlFor="email"
                    className="
            mb-2
            block
            text-xs
            font-semibold
            text-[#222]
          "
                >
                    E-mail
                </label>

                <div
                    className="
            relative
            overflow-hidden
            rounded-xl
            border
            border-black/10
            bg-[#FAFAF8]
            transition-all

            focus-within:border-[#C9A227]/70
            focus-within:bg-white
            focus-within:ring-4
            focus-within:ring-[#C9A227]/10
          "
                >
                    <Mail
                        className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-black/30
            "
                    />

                    <input
                        id="email"
                        type="email"
                        value={
                            email
                        }
                        onChange={(
                            event
                        ) =>
                            setEmail(
                                event
                                    .target
                                    .value
                            )
                        }
                        disabled={
                            loading
                        }
                        required
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="seu@email.com"
                        className="
              h-[52px]
              w-full
              bg-transparent
              pl-11
              pr-4
              text-base
              text-[#111]
              outline-none

              placeholder:text-black/25

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
                    />
                </div>
            </div>

            {/* ======================================================
          SENHA
      ======================================================= */}

            <div>
                <label
                    htmlFor="password"
                    className="
            mb-2
            block
            text-xs
            font-semibold
            text-[#222]
          "
                >
                    Senha
                </label>

                <div
                    className="
            relative
            overflow-hidden
            rounded-xl
            border
            border-black/10
            bg-[#FAFAF8]
            transition-all

            focus-within:border-[#C9A227]/70
            focus-within:bg-white
            focus-within:ring-4
            focus-within:ring-[#C9A227]/10
          "
                >
                    <LockKeyhole
                        className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-black/30
            "
                    />

                    <input
                        id="password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        value={
                            password
                        }
                        onChange={(
                            event
                        ) =>
                            setPassword(
                                event
                                    .target
                                    .value
                            )
                        }
                        disabled={
                            loading
                        }
                        required
                        autoComplete="current-password"
                        placeholder="Sua senha"
                        className="
              h-[52px]
              w-full
              bg-transparent
              pl-11
              pr-14
              text-base
              text-[#111]
              outline-none

              placeholder:text-black/25

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (
                                    current
                                ) =>
                                    !current
                            )
                        }
                        disabled={
                            loading
                        }
                        aria-label={
                            showPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                        }
                        className="
              absolute
              right-1
              top-1/2
              flex
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-lg
              text-black/35
              transition-colors

              hover:bg-black/[0.04]
              hover:text-black/60

              disabled:opacity-50
            "
                    >
                        {showPassword ? (
                            <EyeOff
                                className="
                  h-4
                  w-4
                "
                            />
                        ) : (
                            <Eye
                                className="
                  h-4
                  w-4
                "
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* ======================================================
          ERRO
      ======================================================= */}

            {error && (
                <div
                    role="alert"
                    className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            leading-5
            text-red-700
          "
                >
                    {error}
                </div>
            )}

            {/* ======================================================
          BOTÃO
      ======================================================= */}

            <button
                type="submit"
                disabled={
                    loading
                }
                className="
          flex
          min-h-[52px]
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#C9A227]
          px-5
          text-sm
          font-bold
          text-black
          shadow-[0_10px_30px_rgba(201,162,39,0.18)]
          transition-all

          hover:bg-[#D8B43B]
          hover:shadow-[0_12px_34px_rgba(201,162,39,0.25)]

          active:scale-[0.99]

          disabled:cursor-not-allowed
          disabled:opacity-60
        "
            >
                {loading ? (
                    <>
                        <Loader2
                            className="
                h-4
                w-4
                animate-spin
              "
                        />

                        Entrando...
                    </>
                ) : (
                    <>
                        <LogIn
                            className="
                h-4
                w-4
              "
                        />

                        Entrar
                    </>
                )}
            </button>
        </form>
    );
}

/* ============================================================
   MENSAGENS DE ERRO
============================================================ */

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