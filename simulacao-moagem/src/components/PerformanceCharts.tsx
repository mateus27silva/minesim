import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PerformanceChartsProps {
  results: {
    alimentacao: { vazao: number; concentracao: number; densidade: number };
    concentrado: { vazao: number; concentracao: number; densidade: number };
    rejeito: { vazao: number; concentracao: number; densidade: number };
    recuperacao: number;
    razaoConcentracao: number;
    eficienciaSeparacao: number;
  } | null;
}

export default function PerformanceCharts({ results }: PerformanceChartsProps) {
  if (!results) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Execute uma simulação para visualizar os gráficos</p>
        </CardContent>
      </Card>
    );
  }

  const performanceData = [
    { nome: "Recuperação", valor: results.recuperacao, cor: "#22c55e" },
    { nome: "Eficiência de Separação", valor: results.eficienciaSeparacao, cor: "#3b82f6" },
  ];

  const flowData = [
    { nome: "Alimentação", vazao: results.alimentacao.vazao, concentracao: results.alimentacao.concentracao },
    { nome: "Concentrado", vazao: results.concentrado.vazao, concentracao: results.concentrado.concentracao },
    { nome: "Rejeito", vazao: results.rejeito.vazao, concentracao: results.rejeito.concentracao },
  ];

  const distributionData = [
    { 
      name: "Concentrado", 
      value: results.concentrado.vazao, 
      percentage: (results.concentrado.vazao / results.alimentacao.vazao * 100).toFixed(1)
    },
    { 
      name: "Rejeito", 
      value: results.rejeito.vazao, 
      percentage: (results.rejeito.vazao / results.alimentacao.vazao * 100).toFixed(1)
    }
  ];

  const COLORS = ["#3b82f6", "#ef4444"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            {`${payload[0].dataKey}: ${payload[0].value.toFixed(2)}${payload[0].dataKey.includes('Percentual') ? '%' : payload[0].dataKey === 'vazao' ? ' t/h' : '%'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-blue-600">{`${payload[0].value.toFixed(2)} t/h (${payload[0].payload.percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Vazões e Concentrações */}
        <Card>
          <CardHeader>
            <CardTitle>Vazões por Fluxo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vazao" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Massa */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Massa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comparação de Concentrações */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Concentrações</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="concentracao" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}