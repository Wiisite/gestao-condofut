import { useRoute } from "wouter";
import DashboardUnidade from "./DashboardUnidade";

export default function DashboardUnidadeWrapper() {
  const [match, params] = useRoute("/unidade/:filialId");
  const filialId = parseInt(params?.filialId || "0");

  if (!match || !filialId || isNaN(filialId)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ID da unidade inválido</h2>
      </div>
    );
  }

  return <DashboardUnidade filialId={filialId} />;
}