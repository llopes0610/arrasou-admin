"use client";

import {
  type FormEvent,
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

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setError("Informe seu e-mail.");
      return;
    }

    if (!password) {
      setError("Informe sua senha.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Não foi possível entrar."
        );
        return;
      }

      const redirectTo =
        typeof result.redirectTo === "string"
          ? result.redirectTo
          : "/agenda";

      window.location.replace(redirectTo);
    } catch (loginException) {
      console.error(
        "Erro inesperado no login:",
        loginException
      );

      setError(
        "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
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
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={loading}
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
              showPassword ? "text" : "password"
            }
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={loading}
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
                (current) => !current
              )
            }
            disabled={loading}
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
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

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

      <button
        type="submit"
        disabled={loading}
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
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Entrar
          </>
        )}
      </button>
    </form>
  );
}
