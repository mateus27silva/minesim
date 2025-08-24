import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign } from "lucide-react";

interface EconomicAnalysisProps {
  results: {
    alimentacao: { vazao: number; concentracao: number; densidade: number };
    concentrado: { vazao: number; concentracao: number; densidade: number };
    rejeito: { vazao: number; concentracao: number; densidade: number };
    recuperacao: number;
  } | null;
}

interface EconomicData {
  precoConcetrado: number;
  custoProcessamento: number;
  custoPerdaMineral: number;
  horasOperacao: number;
}

export default function EconomicAnalysis({ results }: EconomicAnalysisProps) {
  const [economicData, setEconomicData] = useState<EconomicData>({
    precoConcetrado: 0,
    custoProcessamento: 0,
    custoPerdaMineral: 0,
    horasOperacao: 8760 // 24h x 365 dias
  });

  const [economicResults, setEconomicResults] = useState<any>(null);

  const calculateEconomics = () => {
    if (!results || !economicData.precoConcetrado) return;

    const receitaAnual = results.concentrado.vazao * economicData.horasOperacao * economicData.precoConcetrado;
    const custoProcessamentoAnual = results.alimentacao.vazao * economicData.horasOperacao * economicData.custoProcessamento;
    
    // Calcular perda de mineral no rejeito
    const mineralPerdido = results.rejeito.vazao * results.rejeito.concentracao / 100;
    const custoPerdaAnual = mineralPerdido * economicData.horasOperacao * economicData.custoPerdaMineral;
    
    const lucroOperacionalAnual = receitaAnual - custoProcessamentoAnual - custoPerdaAnual;
    const margemLucro = (lucroOperacionalAnual / receitaAnual) * 100;

    setEconomicResults({
      receita: {
        diaria: receitaAnual / 365,
        mensal: receitaAnual / 12,
        anual: receitaAnual
      },
      custos: {
        processamento: custoProcessamentoAnual,
        perdas: custoPerdaAnual,
        total: custoProcessamentoAnual + custoPerdaAnual
      },
      lucro: {
        diario: lucroOperacionalAnual / 365,
        mensal: lucroOperacionalAnual / 12,
        anual: lucroOperacionalAnual
      },
      margemLucro,
      indicadores: {
        receita_por_tonelada_concentrado: economicData.precoConcetrado,
        custo_por_tonelada_alimentacao: economicData.custoProcessamento,
        eficiencia_economica: (results.recuperacao * economicData.precoConcetrado - economicData.custoProcessamento) / economicData.precoConcetrado * 100
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Análise Econômica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Preço do Concentrado (R$/tonelada)</Label>
              <Input
                type="number"
                value={economicData.precoConcetrado || ""}
                onChange={(e) => setEconomicData(prev => ({ ...prev, precoConcetrado: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 1500"
              />
            </div>
            <div>
              <Label>Custo de Processamento (R$/tonelada alimentação)</Label>
              <Input
                type="number"
                value={economicData.custoProcessamento || ""}
                onChange={(e) => setEconomicData(prev => ({ ...prev, custoProcessamento: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 25"
              />
            </div>
            <div>
              <Label>Custo de Perda Mineral (R$/tonelada)</Label>
              <Input
                type="number"
                value={economicData.custoPerdaMineral || ""}
                onChange={(e) => setEconomicData(prev => ({ ...prev, custoPerdaMineral: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 800"
              />
            </div>
            <div>
              <Label>Horas de Operação por Ano</Label>
              <Input
                type="number"
                value={economicData.horasOperacao || ""}
                onChange={(e) => setEconomicData(prev => ({ ...prev, horasOperacao: parseFloat(e.target.value) || 0 }))}
                placeholder="8760 (24h/dia)"
              />
            </div>
          </div>
          
          <Button onClick={calculateEconomics} className="mt-4" disabled={!results}>
            Calcular Análise Econômica
          </Button>
        </CardContent>
      </Card>

      {economicResults && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Receita Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(economicResults.receita.anual)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Mensal: {formatCurrency(economicResults.receita.mensal)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Custos Anuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(economicResults.custos.total)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Processamento + Perdas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Lucro Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(economicResults.lucro.anual)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Margem: {economicResults.margemLucro.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento Econômico</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Diário</TableHead>
                    <TableHead>Mensal</TableHead>
                    <TableHead>Anual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-green-600">Receita</TableCell>
                    <TableCell>{formatCurrency(economicResults.receita.diaria)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.receita.mensal)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.receita.anual)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-orange-600">Custo Processamento</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.processamento / 365)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.processamento / 12)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.processamento)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-red-600">Custo de Perdas</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.perdas / 365)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.perdas / 12)}</TableCell>
                    <TableCell>{formatCurrency(economicResults.custos.perdas)}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-semibold text-blue-600">Lucro Operacional</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(economicResults.lucro.diario)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(economicResults.lucro.mensal)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(economicResults.lucro.anual)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Receita por t de Concentrado</p>
                  <p className="text-lg font-bold">{formatCurrency(economicResults.indicadores.receita_por_tonelada_concentrado)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo por t de Alimentação</p>
                  <p className="text-lg font-bold">{formatCurrency(economicResults.indicadores.custo_por_tonelada_alimentacao)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Eficiência Econômica</p>
                  <p className="text-lg font-bold">{economicResults.indicadores.eficiencia_economica.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}