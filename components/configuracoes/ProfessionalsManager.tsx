"use client";

import {
  useState,
} from "react";

import {
  Edit3,
  Plus,
  UserRound,
} from "lucide-react";

import type {
  ProfessionalItem,
} from "@/app/(admin)/configuracoes/page";

import ProfessionalModal from "./ProfessionalModal";

export default function ProfessionalsManager({
  professionals,
}: {
  professionals:
    ProfessionalItem[];
}) {
  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingProfessional,
    setEditingProfessional,
  ] =
    useState<ProfessionalItem | null>(
      null
    );

  function openNew() {
    setEditingProfessional(
      null
    );

    setModalOpen(
      true
    );
  }

  function openEdit(
    professional:
      ProfessionalItem
  ) {
    setEditingProfessional(
      professional
    );

    setModalOpen(
      true
    );
  }

  return (
    <>
      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-black/10
            p-5

            sm:flex-row
            sm:items-center
            sm:justify-between

            sm:p-6
          "
        >
          <div>
            <h2
              className="
                font-serif
                text-2xl
                font-semibold
                text-[#111]
              "
            >
              Profissionais
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              Controle de usuários,
              comissão e acesso.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNew
            }
            className="
              flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#C9A227]
              px-5
              text-sm
              font-semibold
              text-black

              hover:bg-[#E0C56E]
            "
          >
            <Plus
              className="
                h-4
                w-4
              "
            />

            Nova profissional
          </button>
        </div>

        {/* LISTA */}

        {professionals.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[280px]
              items-center
              justify-center
              text-sm
              text-black/40
            "
          >
            Nenhuma profissional
            cadastrada.
          </div>
        ) : (
          professionals.map(
            (
              professional
            ) => (
              <div
                key={
                  professional.id
                }
                className="
                  flex
                  flex-col
                  gap-4
                  border-b
                  border-black/[0.06]
                  p-5
                  last:border-b-0

                  sm:flex-row
                  sm:items-center
                  sm:justify-between

                  sm:px-6
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-full
                      bg-[#C9A227]/10
                    "
                  >
                    <UserRound
                      className="
                        h-5
                        w-5
                        text-[#C9A227]
                      "
                    />
                  </div>

                  <div>
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-[#111]
                        "
                      >
                        {
                          professional.display_name
                        }
                      </p>

                      <span
                        className={`
                          rounded-full
                          px-2
                          py-1
                          text-[8px]
                          font-bold
                          uppercase

                          ${
                            professional.active
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }
                        `}
                      >
                        {professional.active
                          ? "Ativa"
                          : "Inativa"}
                      </span>
                    </div>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-black/40
                      "
                    >
                      Comissão padrão:{" "}
                      <strong
                        className="
                          text-[#111]
                        "
                      >
                        {
                          Number(
                            professional.default_commission_percentage
                          )
                        }
                        %
                      </strong>
                    </p>

                    {professional.phone && (
                      <p
                        className="
                          mt-0.5
                          text-xs
                          text-black/35
                        "
                      >
                        {
                          professional.phone
                        }
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openEdit(
                      professional
                    )
                  }
                  className="
                    flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-black/10
                    px-4
                    text-xs
                    font-semibold
                    text-black/55

                    hover:bg-black/[0.03]
                  "
                >
                  <Edit3
                    className="
                      h-3.5
                      w-3.5
                    "
                  />

                  Editar
                </button>
              </div>
            )
          )
        )}
      </section>

      <ProfessionalModal
        open={
          modalOpen
        }

        professional={
          editingProfessional
        }

        onClose={() => {
          setModalOpen(
            false
          );

          setEditingProfessional(
            null
          );
        }}
      />
    </>
  );
}