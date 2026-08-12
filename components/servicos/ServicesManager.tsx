"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Clock3,
  Edit3,
  Plus,
  Search,
  UserRound,
  WandSparkles,
} from "lucide-react";

import ServiceModal from "./ServiceModal";

export type ServiceItem = {
  id: string;

  name: string;

  description:
    | string
    | null;

  price:
    | number
    | string;

  duration_minutes: number;

  category:
    | string
    | null;

  active: boolean;
};

export type ProfessionalItem = {
  id: string;

  display_name: string;

  active: boolean;
};

export type ProfessionalServiceLink = {
  id: string;

  professional_id: string;

  service_id: string;

  commission_percentage:
    | number
    | string;

  active: boolean;
};

type ServicesManagerProps = {
  initialServices:
    ServiceItem[];

  professionals:
    ProfessionalItem[];

  initialLinks:
    ProfessionalServiceLink[];
};

export default function ServicesManager({
  initialServices,
  professionals,
  initialLinks,
}: ServicesManagerProps) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "all" |
      "active" |
      "inactive"
    >("all");

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingService,
    setEditingService,
  ] =
    useState<ServiceItem | null>(
      null
    );

  /*
   * ==========================================================
   * FILTRO
   * ==========================================================
   */

  const filteredServices =
    useMemo(() => {
      const term =
        normalizeText(
          search
        );

      return initialServices.filter(
        (service) => {
          const matchesSearch =
            !term ||
            normalizeText(
              service.name
            ).includes(
              term
            ) ||
            normalizeText(
              service.category ??
                ""
            ).includes(
              term
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            (
              statusFilter ===
                "active" &&
              service.active
            ) ||
            (
              statusFilter ===
                "inactive" &&
              !service.active
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      initialServices,
      search,
      statusFilter,
    ]);

  /*
   * ==========================================================
   * NOVO
   * ==========================================================
   */

  function handleNewService() {
    setEditingService(
      null
    );

    setModalOpen(
      true
    );
  }

  /*
   * ==========================================================
   * EDITAR
   * ==========================================================
   */

  function handleEditService(
    service: ServiceItem
  ) {
    setEditingService(
      service
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

            lg:flex-row
            lg:items-center
            lg:justify-between

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
              Catálogo de serviços
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-black/40
              "
            >
              {
                initialServices.length
              }{" "}
              {initialServices.length ===
              1
                ? "serviço cadastrado"
                : "serviços cadastrados"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleNewService
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
              transition-all

              hover:bg-[#E0C56E]
              hover:shadow-md
            "
          >
            <Plus
              className="
                h-4
                w-4
              "
            />

            Novo serviço
          </button>
        </div>

        {/* FILTROS */}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-black/[0.06]
            bg-[#FAFAF8]
            p-4

            lg:flex-row
            lg:items-center
            lg:justify-between

            sm:px-6
          "
        >
          <div
            className="
              relative
              w-full

              lg:max-w-sm
            "
          >
            <Search
              className="
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
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="Buscar serviço..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-black/10
                bg-white
                pl-11
                pr-4
                text-sm
                text-[#111]
                outline-none

                placeholder:text-black/30

                focus:border-[#C9A227]/60
                focus:ring-2
                focus:ring-[#C9A227]/10
              "
            />
          </div>

          {/* STATUS */}

          <div
            className="
              flex
              rounded-xl
              bg-white
              p-1
              shadow-sm
            "
          >
            <FilterButton
              active={
                statusFilter ===
                "all"
              }
              onClick={() =>
                setStatusFilter(
                  "all"
                )
              }
            >
              Todos
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                "active"
              }
              onClick={() =>
                setStatusFilter(
                  "active"
                )
              }
            >
              Ativos
            </FilterButton>

            <FilterButton
              active={
                statusFilter ===
                "inactive"
              }
              onClick={() =>
                setStatusFilter(
                  "inactive"
                )
              }
            >
              Inativos
            </FilterButton>
          </div>
        </div>

        {/* EMPTY */}

        {filteredServices.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              p-6
              text-center
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-[#C9A227]/10
              "
            >
              <WandSparkles
                className="
                  h-5
                  w-5
                  text-[#C9A227]
                "
              />
            </div>

            <p
              className="
                mt-4
                text-sm
                font-semibold
                text-[#111]
              "
            >
              Nenhum serviço
              encontrado
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div
              className="
                hidden
                md:block
              "
            >
              <div
                className="
                  grid
                  grid-cols-[minmax(200px,2fr)_1fr_100px_100px_minmax(180px,1.5fr)_90px]
                  gap-4
                  border-b
                  border-black/[0.06]
                  bg-[#FAFAF8]
                  px-6
                  py-3
                "
              >
                <TableTitle>
                  Serviço
                </TableTitle>

                <TableTitle>
                  Categoria
                </TableTitle>

                <TableTitle>
                  Valor
                </TableTitle>

                <TableTitle>
                  Duração
                </TableTitle>

                <TableTitle>
                  Profissionais
                </TableTitle>

                <span />
              </div>

              {filteredServices.map(
                (
                  service
                ) => (
                  <DesktopRow
                    key={
                      service.id
                    }
                    service={
                      service
                    }
                    links={
                      initialLinks
                    }
                    professionals={
                      professionals
                    }
                    onEdit={() =>
                      handleEditService(
                        service
                      )
                    }
                  />
                )
              )}
            </div>

            {/* MOBILE */}

            <div className="md:hidden">
              {filteredServices.map(
                (
                  service
                ) => (
                  <MobileCard
                    key={
                      service.id
                    }
                    service={
                      service
                    }
                    links={
                      initialLinks
                    }
                    professionals={
                      professionals
                    }
                    onEdit={() =>
                      handleEditService(
                        service
                      )
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* MODAL */}

      <ServiceModal
        open={
          modalOpen
        }

        service={
          editingService
        }

        professionals={
          professionals
        }

        links={
          initialLinks
        }

        onClose={() => {
          setModalOpen(
            false
          );

          setEditingService(
            null
          );
        }}
      />
    </>
  );
}

/* ============================================================
   DESKTOP
============================================================ */

function DesktopRow({
  service,
  links,
  professionals,
  onEdit,
}: {
  service:
    ServiceItem;

  links:
    ProfessionalServiceLink[];

  professionals:
    ProfessionalItem[];

  onEdit:
    () => void;
}) {
  const serviceLinks =
    getServiceLinks(
      service.id,
      links
    );

  return (
    <div
      className="
        grid
        grid-cols-[minmax(200px,2fr)_1fr_100px_100px_minmax(180px,1.5fr)_90px]
        items-center
        gap-4
        border-b
        border-black/[0.06]
        px-6
        py-4
        last:border-b-0
      "
    >
      {/* SERVIÇO */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#C9A227]/10
          "
        >
          <WandSparkles
            className="
              h-4
              w-4
              text-[#C9A227]
            "
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-[#111]
              "
            >
              {service.name}
            </p>

            <StatusBadge
              active={
                service.active
              }
            />
          </div>

          {service.description && (
            <p
              className="
                mt-1
                truncate
                text-xs
                text-black/35
              "
            >
              {service.description}
            </p>
          )}
        </div>
      </div>

      {/* CATEGORIA */}

      <p
        className="
          text-sm
          text-black/50
        "
      >
        {service.category ??
          "—"}
      </p>

      {/* VALOR */}

      <p
        className="
          text-sm
          font-semibold
          text-[#111]
        "
      >
        {formatCurrency(
          Number(
            service.price
          )
        )}
      </p>

      {/* DURAÇÃO */}

      <p
        className="
          flex
          items-center
          gap-1.5
          text-sm
          text-black/50
        "
      >
        <Clock3
          className="
            h-3.5
            w-3.5
          "
        />

        {service.duration_minutes}m
      </p>

      {/* PROFISSIONAIS */}

      <ProfessionalList
        serviceLinks={
          serviceLinks
        }
        professionals={
          professionals
        }
      />

      {/* EDITAR */}

      <button
        type="button"
        onClick={
          onEdit
        }
        className="
          flex
          h-9
          items-center
          justify-center
          gap-1.5
          rounded-lg
          border
          border-black/10
          px-3
          text-xs
          font-semibold
          text-black/55
          transition-colors

          hover:border-[#C9A227]/40
          hover:bg-[#C9A227]/5
          hover:text-[#111]
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
  );
}

/* ============================================================
   MOBILE
============================================================ */

function MobileCard({
  service,
  links,
  professionals,
  onEdit,
}: {
  service:
    ServiceItem;

  links:
    ProfessionalServiceLink[];

  professionals:
    ProfessionalItem[];

  onEdit:
    () => void;
}) {
  const serviceLinks =
    getServiceLinks(
      service.id,
      links
    );

  return (
    <div
      className="
        border-b
        border-black/[0.06]
        p-5
        last:border-b-0
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <h3
              className="
                text-sm
                font-semibold
                text-[#111]
              "
            >
              {service.name}
            </h3>

            <StatusBadge
              active={
                service.active
              }
            />
          </div>

          <p
            className="
              mt-1
              text-xs
              text-black/40
            "
          >
            {service.category ??
              "Sem categoria"}
          </p>
        </div>

        <button
          type="button"
          onClick={
            onEdit
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-black/10
            text-black/45
          "
        >
          <Edit3
            className="
              h-4
              w-4
            "
          />
        </button>
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
        "
      >
        <SmallMetric
          label="Valor"
          value={formatCurrency(
            Number(
              service.price
            )
          )}
        />

        <SmallMetric
          label="Duração"
          value={`${service.duration_minutes} min`}
        />
      </div>

      <div
        className="
          mt-4
          border-t
          border-black/[0.06]
          pt-4
        "
      >
        <p
          className="
            text-[9px]
            font-semibold
            uppercase
            tracking-wider
            text-black/30
          "
        >
          Profissionais
        </p>

        <div className="mt-2">
          <ProfessionalList
            serviceLinks={
              serviceLinks
            }
            professionals={
              professionals
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROFISSIONAIS
============================================================ */

function ProfessionalList({
  serviceLinks,
  professionals,
}: {
  serviceLinks:
    ProfessionalServiceLink[];

  professionals:
    ProfessionalItem[];
}) {
  if (
    serviceLinks.length ===
    0
  ) {
    return (
      <span
        className="
          text-xs
          text-black/30
        "
      >
        Não vinculado
      </span>
    );
  }

  return (
    <div
      className="
        flex
        flex-wrap
        gap-1.5
      "
    >
      {serviceLinks.map(
        (link) => {
          const professional =
            professionals.find(
              (item) =>
                item.id ===
                link.professional_id
            );

          if (
            !professional
          ) {
            return null;
          }

          return (
            <span
              key={
                link.id
              }
              className="
                inline-flex
                items-center
                gap-1
                rounded-full
                bg-[#FAFAF8]
                px-2.5
                py-1
                text-[10px]
                font-medium
                text-black/55
              "
            >
              <UserRound
                className="
                  h-3
                  w-3
                  text-[#C9A227]
                "
              />

              {
                professional.display_name
              }

              <strong>
                {
                  Number(
                    link.commission_percentage
                  )
                }
                %
              </strong>
            </span>
          );
        }
      )}
    </div>
  );
}

/* ============================================================
   AUXILIARES
============================================================ */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-lg
        px-3
        py-2
        text-xs
        font-semibold
        transition-all

        ${
          active
            ? "bg-[#111] text-white"
            : "text-black/40 hover:text-black/70"
        }
      `}
    >
      {children}
    </button>
  );
}

function TableTitle({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      className="
        text-[9px]
        font-semibold
        uppercase
        tracking-[0.12em]
        text-black/35
      "
    >
      {children}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active:
    boolean;
}) {
  return (
    <span
      className={`
        rounded-full
        px-2
        py-1
        text-[8px]
        font-bold
        uppercase
        tracking-wide

        ${
          active
            ? "bg-green-100 text-green-700"
            : "bg-neutral-100 text-neutral-500"
        }
      `}
    >
      {active
        ? "Ativo"
        : "Inativo"}
    </span>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        rounded-xl
        bg-[#FAFAF8]
        p-3
      "
    >
      <p
        className="
          text-[8px]
          font-semibold
          uppercase
          tracking-wider
          text-black/30
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-[#111]
        "
      >
        {value}
      </p>
    </div>
  );
}

function getServiceLinks(
  serviceId: string,
  links:
    ProfessionalServiceLink[]
) {
  return links.filter(
    (link) =>
      link.service_id ===
        serviceId &&
      link.active
  );
}

function normalizeText(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    value
  );
}