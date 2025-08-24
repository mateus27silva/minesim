import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessFlowChartProps {
  alimentacao?: {
    vazao: number;
    concentracao: number;
    densidade: number;
  };
  concentrado?: {
    vazao: number;
    concentracao: number;
    densidade: number;
  };
  rejeito?: {
    vazao: number;
    concentracao: number;
    densidade: number;
  };
  circuitType: string;
}

export default function ProcessFlowChart({ alimentacao, concentrado, rejeito, circuitType }: ProcessFlowChartProps) {
  const getEquipmentName = () => {
    switch (circuitType) {
      case "grinding": return "Moinho";
      case "classification": return "Classificador";
      case "flotation": return "Célula de Flotação";
      case "magnetic": return "Separador Magnético";
      default: return "Equipamento de Separação";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxograma do Processo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-8 p-6 animate-fade-in">
          {/* Alimentação */}
          <div className="flex flex-col items-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 border-2 border-green-300 dark:border-green-700 min-w-[200px] shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <h3 className="font-semibold text-green-800 dark:text-green-200">ALIMENTAÇÃO</h3>
                {alimentacao && (
                  <div className="text-xs mt-2 space-y-1">
                    <p>Vazão: {alimentacao.vazao.toFixed(1)} t/h</p>
                    <p>Teor: {alimentacao.concentracao.toFixed(1)}%</p>
                    <p>Densidade: {alimentacao.densidade.toFixed(1)} t/m³</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Seta para baixo */}
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-600 mt-4"></div>
          </div>

          {/* Equipamento de Separação */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border-2 border-blue-300 dark:border-blue-700 min-w-[250px] shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-lg">{getEquipmentName()}</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">Processo de Separação</p>
            </div>
          </div>

          {/* Setas de saída */}
          <div className="flex items-center space-x-16">
            {/* Linha para concentrado */}
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-600 mb-4"></div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700 min-w-[180px] shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">CONCENTRADO</h3>
                  {concentrado && (
                    <div className="text-xs mt-2 space-y-1">
                      <p>Vazão: {concentrado.vazao.toFixed(1)} t/h</p>
                      <p>Teor: {concentrado.concentracao.toFixed(1)}%</p>
                      <p>Densidade: {concentrado.densidade.toFixed(1)} t/m³</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linha para rejeito */}
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-600 mb-4"></div>
              <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 border-2 border-red-300 dark:border-red-700 min-w-[180px] shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <h3 className="font-semibold text-red-800 dark:text-red-200">REJEITO</h3>
                  {rejeito && (
                    <div className="text-xs mt-2 space-y-1">
                      <p>Vazão: {rejeito.vazao.toFixed(1)} t/h</p>
                      <p>Teor: {rejeito.concentracao.toFixed(1)}%</p>
                      <p>Densidade: {rejeito.densidade.toFixed(1)} t/m³</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Fluxograma simplificado do processo de separação em {getEquipmentName().toLowerCase()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}