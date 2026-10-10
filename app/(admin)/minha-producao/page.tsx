import { requireProfessionalAccess } from "@/lib/auth/access";
import { getMyProduction } from "@/lib/minha-producao/queries";
import MinhaProducaoDashboard from "@/components/minha-producao/MinhaProducaoDashboard";

export const dynamic = "force-dynamic";

export default async function MinhaProducaoPage() {
  const { professional } = await requireProfessionalAccess();
  const data = await getMyProduction(professional.id);
  return <MinhaProducaoDashboard professionalName={professional.display_name} {...data} />;
}
