import { useState } from "react";
import { Play, FileSpreadsheet, Trash2, BarChart3, Settings, ArrowRight, HelpCircle, DollarSign, TrendingUp, Zap, FileText, Circle, Triangle, Square, Minus, Divide } from "lucide-react";

interface StreamData {
  vazao: number;
  concentracao: number;
  densidade: number;
}

interface Equipment {
  id: string;
  type: 'moinho' | 'britador' | 'rougher' | 'cleaner' | 'recleaner';
  x: number;
  y: number;
  name: string;
  parameters: EquipmentParameters;
}

interface EquipmentParameters {
  // Parâmetros comuns
  alimentacao?: StreamData;
  concentrado?: StreamData;
  rejeito?: StreamData;
  
  // Parâmetros específicos
  potencia?: number; // kW (para moinhos)
  diametro?: number; // m
  comprimento?: number; // m
  velocidadeRotacao?: number; // rpm
  abertura?: number; // mm (para britadores)
  pressaoAr?: number; // kPa (para flotação)
  dosagem?: number; // g/t (reagentes)
  tempoRetencao?: number; // min
  eficiencia?: number; // %
}

interface FlowLine {
  id: string;
  fromId: string;
  toId: string;
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
}

interface EconomicData {
  capex: number;
  opexAnual: number;
  receita: number;
  vidaUtil: number;
  taxaDesconto: number;
  custoEnergia: number;
  custoMaodeObra: number;
  custoManutencao: number;
}

interface EconomicResults {
  vpl: number;
  tir: number;
  payback: number;
  roi: number;
  custoTonelada: number;
}

interface OptimizationParams {
  targetRecovery: number;
  maxDensity: number;
  minGrade: number;
  energyLimit: number;
}

interface BalanceResults {
  alimentacao: StreamData;
  concentrado: StreamData;
  rejeito: StreamData;
  recuperacao: number;
  razaoConcentracao: number;
  eficienciaSeparacao: number;
}

export default function App() {
  const [activeMenuItem, setActiveMenuItem] = useState("simulacao");
  const [activeTool, setActiveTool] = useState("moinho");
  
  // Estados da simulação
  const [circuitType, setCircuitType] = useState<string>("grinding");
  const [alimentacao, setAlimentacao] = useState<StreamData>({ vazao: 0, concentracao: 0, densidade: 0 });
  const [concentrado, setConcentrado] = useState<StreamData>({ vazao: 0, concentracao: 0, densidade: 0 });
  const [rejeito, setRejeito] = useState<StreamData>({ vazao: 0, concentracao: 0, densidade: 0 });
  const [results, setResults] = useState<BalanceResults | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Estados do fluxograma
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [flowLines, setFlowLines] = useState<FlowLine[]>([]);
  const [nextEquipmentId, setNextEquipmentId] = useState(1);
  
  // Estados do menu de contexto
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; equipmentId: string } | null>(null);
  
  // Estados de edição
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados econômicos
  const [economicData, setEconomicData] = useState<EconomicData>({
    capex: 0,
    opexAnual: 0,
    receita: 0,
    vidaUtil: 10,
    taxaDesconto: 12,
    custoEnergia: 0.08,
    custoMaodeObra: 50000,
    custoManutencao: 25000
  });
  const [economicResults, setEconomicResults] = useState<EconomicResults | null>(null);
  
  // Estados de otimização
  const [optimizationParams, setOptimizationParams] = useState<OptimizationParams>({
    targetRecovery: 85,
    maxDensity: 5.0,
    minGrade: 60,
    energyLimit: 15
  });
  
  // Estados de histórico para gráficos
  const [simulationHistory, setSimulationHistory] = useState<BalanceResults[]>([]);

  // Função para obter parâmetros padrão por tipo de equipamento
  const getDefaultParameters = (type: Equipment['type']): EquipmentParameters => {
    const defaults = {
      moinho: {
        potencia: 1000,
        diametro: 3.5,
        comprimento: 4.2,
        velocidadeRotacao: 18,
        eficiencia: 85
      },
      britador: {
        abertura: 25,
        potencia: 500,
        eficiencia: 80
      },
      rougher: {
        pressaoAr: 150,
        dosagem: 150,
        tempoRetencao: 8,
        eficiencia: 75
      },
      cleaner: {
        pressaoAr: 120,
        dosagem: 50,
        tempoRetencao: 4,
        eficiencia: 80
      },
      recleaner: {
        pressaoAr: 100,
        dosagem: 25,
        tempoRetencao: 3,
        eficiencia: 85
      }
    };
    
    return defaults[type];
  };
  
  // Função para adicionar equipamento no canvas
  const addEquipment = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!['moinho', 'britador', 'rougher', 'cleaner', 'recleaner'].includes(activeTool)) {
      return; // Só adiciona equipamentos, não linhas
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const equipmentNames = {
      moinho: 'Moinho',
      britador: 'Britador',
      rougher: 'Rougher',
      cleaner: 'Cleaner',
      recleaner: 'Recleaner'
    };
    
    const newEquipment: Equipment = {
      id: `eq_${nextEquipmentId}`,
      type: activeTool as Equipment['type'],
      x: x - 30, // Centralizar o equipamento no clique
      y: y - 20,
      name: `${equipmentNames[activeTool as keyof typeof equipmentNames]}-${nextEquipmentId}`,
      parameters: getDefaultParameters(activeTool as Equipment['type'])
    };
    
    setEquipments(prev => [...prev, newEquipment]);
    setNextEquipmentId(prev => prev + 1);
  };
  
  // Função para renderizar equipamento
  const renderEquipment = (equipment: Equipment) => {
    const equipmentStyles = {
      moinho: { color: '#4a90b8', symbol: '●', size: '32px' },
      britador: { color: '#dc2626', symbol: '▲', size: '28px' },
      rougher: { color: '#059669', symbol: '■', size: '30px' },
      cleaner: { color: '#2563eb', symbol: '■', size: '26px' },
      recleaner: { color: '#7c3aed', symbol: '■', size: '22px' }
    };
    
    const style = equipmentStyles[equipment.type];
    
    return (
      <div
        key={equipment.id}
        onContextMenu={(e) => showContextMenu(e, equipment.id)}
        style={{
          position: 'absolute',
          left: equipment.x,
          top: equipment.y,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        title={`${equipment.name} (${equipment.type}) - CLIQUE DIREITO para menu`}
        onMouseEnter={() => console.log('Mouse sobre equipamento:', equipment.id)}
      >
        <div style={{
          color: style.color,
          fontSize: style.size,
          lineHeight: '1',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          {style.symbol}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#374151',
          fontWeight: '600',
          marginTop: '2px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '1px 4px',
          borderRadius: '2px',
          border: '1px solid #d1d5db'
        }}>
          {equipment.name}
        </div>
      </div>
    );
  };
  
  const calculateBalance = () => {
    const newErrors: string[] = [];
    
    // Validações básicas
    if (!alimentacao.vazao || !alimentacao.concentracao || !alimentacao.densidade) {
      newErrors.push("Dados de alimentação incompletos");
    }
    
    if (!concentrado.concentracao || !concentrado.densidade) {
      newErrors.push("Dados de concentrado incompletos");
    }
    
    if (!rejeito.concentracao || !rejeito.densidade) {
      newErrors.push("Dados de rejeito incompletos");
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Cálculos de balanço de massa
    const F = alimentacao.vazao;
    const f = alimentacao.concentracao;
    const c = concentrado.concentracao;
    const t = rejeito.concentracao;
    
    // Calcular vazões usando balanço de massa
    const C = (F * (f - t)) / (c - t);
    const T = F - C;
    
    // Validar se os resultados são fisicamente possíveis
    if (C < 0 || T < 0) {
      setErrors(["Dados inconsistentes - resultados não físicos"]);
      return;
    }
    
    // Calcular parâmetros de desempenho
    const recuperacao = (C * c) / (F * f) * 100;
    const razaoConcentracao = c / f;
    const eficienciaSeparacao = recuperacao * (c - f) / (c * (100 - f));
    
    const newResults: BalanceResults = {
      alimentacao: { ...alimentacao },
      concentrado: { vazao: C, concentracao: c, densidade: concentrado.densidade },
      rejeito: { vazao: T, concentracao: t, densidade: rejeito.densidade },
      recuperacao,
      razaoConcentracao,
      eficienciaSeparacao
    };
    
    setResults(newResults);
    setErrors([]);
    
    // Adicionar ao histórico para gráficos
    setSimulationHistory(prev => [...prev, newResults].slice(-20)); // Manter últimas 20 simulações
  };
  
  const calculateEconomics = () => {
    if (!results || !economicData.capex || !economicData.opexAnual) {
      setErrors(["Execute uma simulação e preencha os dados econômicos antes de calcular"]);
      return;
    }
    
    const receitaAnual = results.concentrado.vazao * 8760 * economicData.receita / 1000; // t/ano * preço
    const custoOperacional = economicData.opexAnual + 
                           (results.alimentacao.vazao * 8760 * economicData.custoEnergia) +
                           economicData.custoMaodeObra + economicData.custoManutencao;
    
    const fluxoCaixaAnual = receitaAnual - custoOperacional;
    
    // Cálculo do VPL
    let vpl = -economicData.capex;
    for (let ano = 1; ano <= economicData.vidaUtil; ano++) {
      vpl += fluxoCaixaAnual / Math.pow(1 + economicData.taxaDesconto / 100, ano);
    }
    
    // Cálculo da TIR (aproximação)
    let tir = 0;
    for (let taxa = 1; taxa <= 100; taxa += 0.1) {
      let vplTeste = -economicData.capex;
      for (let ano = 1; ano <= economicData.vidaUtil; ano++) {
        vplTeste += fluxoCaixaAnual / Math.pow(1 + taxa / 100, ano);
      }
      if (vplTeste <= 0) {
        tir = taxa - 0.1;
        break;
      }
    }
    
    // Payback simples
    const payback = economicData.capex / fluxoCaixaAnual;
    
    // ROI
    const roi = ((fluxoCaixaAnual * economicData.vidaUtil) - economicData.capex) / economicData.capex * 100;
    
    // Custo por tonelada
    const custoTonelada = custoOperacional / (results.concentrado.vazao * 8760);
    
    const economicResult: EconomicResults = {
      vpl,
      tir,
      payback,
      roi,
      custoTonelada
    };
    
    setEconomicResults(economicResult);
  };
  
  const optimizeParameters = () => {
    // Algoritmo simples de otimização baseado nos parâmetros alvo
    const bestParams = { ...alimentacao };
    let bestRecovery = 0;
    
    // Teste diferentes concentrações de alimentação
    for (let conc = 10; conc <= 40; conc += 2) {
      const testAlimentacao = { ...alimentacao, concentracao: conc };
      
      // Simular com estes parâmetros
      const F = testAlimentacao.vazao;
      const f = testAlimentacao.concentracao;
      const c = Math.min(concentrado.concentracao, optimizationParams.minGrade);
      const t = rejeito.concentracao;
      
      if (c > f && f > t) {
        const C = (F * (f - t)) / (c - t);
        const recuperacao = (C * c) / (F * f) * 100;
        
        if (recuperacao > bestRecovery && recuperacao <= optimizationParams.targetRecovery + 5) {
          bestRecovery = recuperacao;
          bestParams.concentracao = conc;
        }
      }
    }
    
    setAlimentacao(bestParams);
    setErrors([`Otimização concluída! Nova concentração de alimentação: ${bestParams.concentracao.toFixed(2)}%`]);
  };

  const loadExample = (type: string) => {
    switch (type) {
      case "iron-ore":
        setAlimentacao({ vazao: 100, concentracao: 35.5, densidade: 3.8 });
        setConcentrado({ vazao: 0, concentracao: 68.2, densidade: 4.8 });
        setRejeito({ vazao: 0, concentracao: 8.5, densidade: 2.9 });
        setCircuitType("flotation");
        break;
      case "copper":
        setAlimentacao({ vazao: 50, concentracao: 0.85, densidade: 2.7 });
        setConcentrado({ vazao: 0, concentracao: 28.5, densidade: 3.2 });
        setRejeito({ vazao: 0, concentracao: 0.12, densidade: 2.6 });
        setCircuitType("flotation");
        break;
      case "coal":
        setAlimentacao({ vazao: 200, concentracao: 25.8, densidade: 1.6 });
        setConcentrado({ vazao: 0, concentracao: 5.2, densidade: 1.3 });
        setRejeito({ vazao: 0, concentracao: 68.5, densidade: 2.1 });
        setCircuitType("grinding");
        break;
    }
    setResults(null);
    setErrors([]);
  };

  const resetForm = () => {
    setAlimentacao({ vazao: 0, concentracao: 0, densidade: 0 });
    setConcentrado({ vazao: 0, concentracao: 0, densidade: 0 });
    setRejeito({ vazao: 0, concentracao: 0, densidade: 0 });
    setResults(null);
    setErrors([]);
  };
  
  const clearCanvas = () => {
    setEquipments([]);
    setFlowLines([]);
    setNextEquipmentId(1);
  };
  
  // Funções do menu de contexto
  const showContextMenu = (event: React.MouseEvent, equipmentId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Menu de contexto acionado para equipamento:', equipmentId);
    console.log('Posição do clique:', event.clientX, event.clientY);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({ 
      x: event.clientX, 
      y: event.clientY, 
      equipmentId 
    });
    
    console.log('Estado do contextMenu definido:', { x: event.clientX, y: event.clientY, equipmentId });
  };
  
  const hideContextMenu = () => setContextMenu(null);
  
  const deleteEquipment = (equipmentId: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
    hideContextMenu();
  };
  
  const editEquipment = (equipmentId: string) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (equipment) {
      setEditingEquipment(equipment);
      setShowEditModal(true);
    }
    hideContextMenu();
  };
  
  const saveEquipment = (updatedEquipment: Equipment) => {
    setEquipments(prev => prev.map(eq => 
      eq.id === updatedEquipment.id ? updatedEquipment : eq
    ));
    setShowEditModal(false);
    setEditingEquipment(null);
  };

  // Renderizar menu de contexto
  const renderContextMenu = () => {
    if (!contextMenu) return null;
    
    console.log('Renderizando menu de contexto:', contextMenu);
    
    return (
      <div
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          minWidth: '150px'
        }}
      >
        <button
          onClick={() => editEquipment(contextMenu.equipmentId)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'white',
            textAlign: 'left',
            fontSize: '14px',
            cursor: 'pointer',
            borderBottom: '1px solid #e5e7eb',
            color: '#333'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ✏️ Editar Parâmetros
        </button>
        <button
          onClick={() => deleteEquipment(contextMenu.equipmentId)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'white',
            textAlign: 'left',
            fontSize: '14px',
            cursor: 'pointer',
            color: '#dc2626',
            color: '#dc2626'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          🗑️ Deletar
        </button>
      </div>
    );
  };
  
  // Renderizar modal de edição
  const renderEditModal = () => {
    if (!showEditModal || !editingEquipment) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #d1d5db'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Editar {editingEquipment.name}</h3>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '500' }}>Nome:</label>
            <input
              type="text"
              value={editingEquipment.name}
              onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
              style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Parâmetros Técnicos:</h4>
            {renderEquipmentParameters()}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => editingEquipment && saveEquipment(editingEquipment)}
              style={{ padding: '8px 16px', backgroundColor: '#4a90b8', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSimulationPanel = () => (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Tool Palette - Equipamentos */}
      <div className="tool-palette">
        <div style={{ fontSize: '9px', color: '#6b7280', textAlign: 'center', marginBottom: '8px', fontWeight: '600' }}>EQUIPAMENTOS</div>
        
        <button 
          className={`tool-btn ${activeTool === "moinho" ? "active" : ""}`}
          onClick={() => setActiveTool("moinho")}
          title="Moinho de Bolas"
        >
          <Circle size={16} color="#4a90b8" fill={activeTool === "moinho" ? "#4a90b8" : "none"} />
        </button>
        
        <button 
          className={`tool-btn ${activeTool === "britador" ? "active" : ""}`}
          onClick={() => setActiveTool("britador")}
          title="Britador"
        >
          <Triangle size={16} color="#dc2626" fill={activeTool === "britador" ? "#dc2626" : "none"} />
        </button>
        
        <button 
          className={`tool-btn ${activeTool === "rougher" ? "active" : ""}`}
          onClick={() => setActiveTool("rougher")}
          title="Flotação Rougher"
        >
          <Square size={16} color="#059669" fill={activeTool === "rougher" ? "#059669" : "none"} />
        </button>
        
        <button 
          className={`tool-btn ${activeTool === "cleaner" ? "active" : ""}`}
          onClick={() => setActiveTool("cleaner")}
          title="Flotação Cleaner"
        >
          <Square size={14} color="#2563eb" fill={activeTool === "cleaner" ? "#2563eb" : "none"} />
        </button>
        
        <button 
          className={`tool-btn ${activeTool === "recleaner" ? "active" : ""}`}
          onClick={() => setActiveTool("recleaner")}
          title="Flotação Recleaner"
        >
          <Square size={12} color="#7c3aed" fill={activeTool === "recleaner" ? "#7c3aed" : "none"} />
        </button>
        
        <div style={{ width: '100%', height: '1px', backgroundColor: '#d1d5db', margin: '8px 0' }}></div>
        
        <button 
          className={`tool-btn ${activeTool === "linha" ? "active" : ""}`}
          onClick={() => setActiveTool("linha")}
          title="Linha de Fluxo"
        >
          <Minus size={16} color="#6b7280" />
        </button>
        
        <button 
          className={`tool-btn ${activeTool === "seta" ? "active" : ""}`}
          onClick={() => setActiveTool("seta")}
          title="Seta de Direção"
        >
          <ArrowRight size={16} color="#6b7280" />
        </button>
      </div>

      {/* Canvas de Desenho */}
      <div 
        onClick={addEquipment}
        onContextMenu={(e) => { e.preventDefault(); hideContextMenu(); }}
        style={{ 
          flex: 1, 
          backgroundColor: 'white',
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          position: 'relative',
          border: '1px solid #d1d5db',
          cursor: ['moinho', 'britador', 'rougher', 'cleaner', 'recleaner'].includes(activeTool) ? 'crosshair' : 'default'
        }}
      >
        {/* Header do Canvas */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '12px',
          fontWeight: '600',
          color: '#374151'
        }}>
          📐 Área de Desenho do Fluxograma
        </div>
        
        {/* Instruções */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '6px 10px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '11px',
          color: '#6b7280',
          maxWidth: '300px'
        }}>
          Selecione um equipamento na paleta e clique no canvas para adicionar
        </div>
        
        {/* Indicador da ferramenta ativa */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '6px 10px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '11px',
          color: '#374151',
          fontWeight: '500'
        }}>
          Ferramenta: {activeTool === 'moinho' ? '🔵 Moinho' :
                     activeTool === 'britador' ? '🔺 Britador' :
                     activeTool === 'rougher' ? '🟩 Rougher' :
                     activeTool === 'cleaner' ? '🟦 Cleaner' :
                     activeTool === 'recleaner' ? '🟪 Recleaner' :
                     activeTool === 'linha' ? '➖ Linha' :
                     activeTool === 'seta' ? '➡️ Seta' : '👆 Selecione'}
        </div>
        
        {/* Equipamentos no Canvas */}
        {equipments.map(equipment => renderEquipment(equipment))}
        
        {/* Menu de contexto */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 9999,
              minWidth: '160px',
              padding: '4px 0'
            }}
          >
            <button
              onClick={() => {
                const equipment = equipments.find(eq => eq.id === contextMenu.equipmentId);
                if (equipment) {
                  setEditingEquipment(equipment);
                  setShowEditModal(true);
                }
                hideContextMenu();
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#374151',
                fontWeight: '500',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ⚙️ Editar Parâmetros
            </button>
            <button
              onClick={() => deleteEquipment(contextMenu.equipmentId)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#dc2626',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🗑️ Deletar Equipamento
            </button>
          </div>
        )}
        
        {/* Contador de equipamentos */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '10px',
          color: '#6b7280'
        }}>
          Equipamentos: {equipments.length}
        </div>
      </div>
      
      {/* Modal de Edição */}
      {showEditModal && editingEquipment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #d1d5db',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Editar {editingEquipment.name}
              </h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingEquipment(null); }}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Nome do Equipamento:</label>
              <input
                type="text"
                value={editingEquipment.name}
                onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Parâmetros Técnicos:</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {editingEquipment.type === 'moinho' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Potência (kW):</label>
                      <input type="number" value={editingEquipment.parameters.potencia || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, potencia: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Diâmetro (m):</label>
                      <input type="number" step="0.1" value={editingEquipment.parameters.diametro || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, diametro: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Comprimento (m):</label>
                      <input type="number" step="0.1" value={editingEquipment.parameters.comprimento || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, comprimento: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Rotação (rpm):</label>
                      <input type="number" value={editingEquipment.parameters.velocidadeRotacao || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, velocidadeRotacao: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}
                
                {editingEquipment.type === 'britador' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Abertura (mm):</label>
                      <input type="number" value={editingEquipment.parameters.abertura || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, abertura: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Potência (kW):</label>
                      <input type="number" value={editingEquipment.parameters.potencia || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, potencia: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}
                
                {['rougher', 'cleaner', 'recleaner'].includes(editingEquipment.type) && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Pressão Ar (kPa):</label>
                      <input type="number" value={editingEquipment.parameters.pressaoAr || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, pressaoAr: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Dosagem Reagente (g/t):</label>
                      <input type="number" value={editingEquipment.parameters.dosagem || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, dosagem: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Tempo Retenção (min):</label>
                      <input type="number" value={editingEquipment.parameters.tempoRetencao || 0}
                        onChange={(e) => setEditingEquipment(prev => prev ? {
                          ...prev, parameters: { ...prev.parameters, tempoRetencao: parseFloat(e.target.value) || 0 }
                        } : null)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Eficiência (%):</label>
                  <input type="number" step="0.1" value={editingEquipment.parameters.eficiencia || 0}
                    onChange={(e) => setEditingEquipment(prev => prev ? {
                      ...prev, parameters: { ...prev.parameters, eficiencia: parseFloat(e.target.value) || 0 }
                    } : null)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowEditModal(false); setEditingEquipment(null); }}
                style={{ padding: '10px 20px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingEquipment) {
                    setEquipments(prev => prev.map(eq => eq.id === editingEquipment.id ? editingEquipment : eq));
                    setShowEditModal(false);
                    setEditingEquipment(null);
                  }
                }}
                style={{ padding: '10px 20px', backgroundColor: '#4a90b8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderParametersPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Configuração da Simulação</h3>
      
      {/* Tipo de Circuito */}
      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
          Tipo de Circuito:
        </label>
        <select 
          value={circuitType} 
          onChange={(e) => setCircuitType(e.target.value)}
          style={{ 
            width: '200px', 
            padding: '6px', 
            border: '1px solid #d1d5db', 
            borderRadius: '3px',
            fontSize: '12px'
          }}
        >
          <option value="grinding">Moagem Primária</option>
          <option value="classification">Classificação</option>
          <option value="flotation">Flotação</option>
          <option value="magnetic">Separação Magnética</option>
        </select>
      </div>

      {/* Dados de Entrada */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        {/* Alimentação */}
        <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#059669', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Alimentação</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Vazão (t/h):</label>
            <input
              type="number"
              value={alimentacao.vazao || ""}
              onChange={(e) => setAlimentacao(prev => ({ ...prev, vazao: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 100"
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Concentração (%):</label>
            <input
              type="number"
              value={alimentacao.concentracao || ""}
              onChange={(e) => setAlimentacao(prev => ({ ...prev, concentracao: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 15.5"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Densidade (t/m³):</label>
            <input
              type="number"
              value={alimentacao.densidade || ""}
              onChange={(e) => setAlimentacao(prev => ({ ...prev, densidade: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 2.7"
            />
          </div>
        </div>

        {/* Concentrado */}
        <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#2563eb', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Concentrado</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Vazão (t/h):</label>
            <input
              type="number"
              value={concentrado.vazao || ""}
              readOnly
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', backgroundColor: '#f9fafb' }}
              placeholder="Calculado automaticamente"
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Concentração (%):</label>
            <input
              type="number"
              value={concentrado.concentracao || ""}
              onChange={(e) => setConcentrado(prev => ({ ...prev, concentracao: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 65.0"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Densidade (t/m³):</label>
            <input
              type="number"
              value={concentrado.densidade || ""}
              onChange={(e) => setConcentrado(prev => ({ ...prev, densidade: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 4.2"
            />
          </div>
        </div>

        {/* Rejeito */}
        <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#dc2626', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Rejeito</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Vazão (t/h):</label>
            <input
              type="number"
              value={rejeito.vazao || ""}
              readOnly
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px', backgroundColor: '#f9fafb' }}
              placeholder="Calculado automaticamente"
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Concentração (%):</label>
            <input
              type="number"
              value={rejeito.concentracao || ""}
              onChange={(e) => setRejeito(prev => ({ ...prev, concentracao: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 2.5"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Densidade (t/m³):</label>
            <input
              type="number"
              value={rejeito.densidade || ""}
              onChange={(e) => setRejeito(prev => ({ ...prev, densidade: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="Ex: 2.6"
            />
          </div>
        </div>
      </div>

      {/* Exemplos */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>Exemplos Práticos:</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => loadExample("iron-ore")}
            style={{ padding: '6px 12px', border: '1px solid #4a90b8', backgroundColor: 'white', color: '#4a90b8', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
          >
            Minério de Ferro
          </button>
          <button 
            onClick={() => loadExample("copper")}
            style={{ padding: '6px 12px', border: '1px solid #4a90b8', backgroundColor: 'white', color: '#4a90b8', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
          >
            Cobre
          </button>
          <button 
            onClick={() => loadExample("coal")}
            style={{ padding: '6px 12px', border: '1px solid #4a90b8', backgroundColor: 'white', color: '#4a90b8', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
          >
            Carvão
          </button>
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={calculateBalance}
          style={{ padding: '8px 16px', backgroundColor: '#4a90b8', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
        >
          Calcular Balanço
        </button>
        <button 
          onClick={resetForm}
          style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
        >
          Limpar
        </button>
      </div>

      {/* Erros */}
      {errors.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '12px', marginBottom: '20px' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#dc2626' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderResultsPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      {results ? (
        <>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Resultados da Simulação</h3>
          
          {/* Indicadores Principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
            <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
              <h4 style={{ color: '#059669', marginBottom: '10px', fontSize: '14px' }}>Recuperação</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                {results.recuperacao.toFixed(2)}%
              </div>
            </div>
            <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
              <h4 style={{ color: '#2563eb', marginBottom: '10px', fontSize: '14px' }}>Razão de Concentração</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                {results.razaoConcentracao.toFixed(2)}
              </div>
            </div>
            <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
              <h4 style={{ color: '#7c3aed', marginBottom: '10px', fontSize: '14px' }}>Eficiência de Separação</h4>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                {results.eficienciaSeparacao.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Tabela Detalhada */}
          <div style={{ border: '1px solid #d1d5db', borderRadius: '4px' }}>
            <h4 style={{ padding: '15px', margin: 0, backgroundColor: '#f9fafb', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #d1d5db' }}>
              Balanço de Massa Detalhado
            </h4>
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #e5e7eb' }}>Fluxo</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>Vazão (t/h)</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>Concentração (%)</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>Densidade (t/m³)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Vazão Volumétrica (m³/h)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', fontWeight: '600', color: '#059669' }}>Alimentação</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.alimentacao.vazao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.alimentacao.concentracao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.alimentacao.densidade.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{(results.alimentacao.vazao / results.alimentacao.densidade).toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', fontWeight: '600', color: '#2563eb' }}>Concentrado</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.concentrado.vazao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.concentrado.concentracao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.concentrado.densidade.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{(results.concentrado.vazao / results.concentrado.densidade).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', fontWeight: '600', color: '#dc2626' }}>Rejeito</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.rejeito.vazao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.rejeito.concentracao.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{results.rejeito.densidade.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{(results.rejeito.vazao / results.rejeito.densidade).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#6b7280' }}>Nenhum Resultado</h3>
          <p style={{ fontSize: '14px' }}>Execute uma simulação para visualizar os resultados</p>
        </div>
      )}
    </div>
  );
  
  const renderEconomicsPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Análise Econômica</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#2563eb', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Custos e Investimento</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>CAPEX (R$):</label>
            <input
              type="number"
              value={economicData.capex || ""}
              onChange={(e) => setEconomicData(prev => ({ ...prev, capex: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="5000000"
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>OPEX Anual (R$):</label>
            <input
              type="number"
              value={economicData.opexAnual || ""}
              onChange={(e) => setEconomicData(prev => ({ ...prev, opexAnual: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="800000"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Preço Concentrado (R$/t):</label>
            <input
              type="number"
              value={economicData.receita || ""}
              onChange={(e) => setEconomicData(prev => ({ ...prev, receita: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="150"
            />
          </div>
        </div>
        
        <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#059669', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Parâmetros</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Vida Útil (anos):</label>
            <input
              type="number"
              value={economicData.vidaUtil || ""}
              onChange={(e) => setEconomicData(prev => ({ ...prev, vidaUtil: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="10"
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Taxa Desconto (%):</label>
            <input
              type="number"
              value={economicData.taxaDesconto || ""}
              onChange={(e) => setEconomicData(prev => ({ ...prev, taxaDesconto: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="12"
            />
          </div>
          
          <div>
            <button 
              onClick={calculateEconomics}
              style={{ padding: '8px 16px', backgroundColor: '#4a90b8', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer', width: '100%' }}
            >
              Calcular VPL/TIR
            </button>
          </div>
        </div>
      </div>
      
      {economicResults && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
            <h4 style={{ color: '#059669', marginBottom: '10px', fontSize: '14px' }}>VPL</h4>
            <div style={{ fontSize: '20px', fontWeight: '700', color: economicResults.vpl >= 0 ? '#059669' : '#dc2626' }}>
              R$ {economicResults.vpl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
            <h4 style={{ color: '#2563eb', marginBottom: '10px', fontSize: '14px' }}>TIR</h4>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
              {economicResults.tir.toFixed(1)}%
            </div>
          </div>
          <div style={{ border: '1px solid #d1d5db', padding: '15px', borderRadius: '4px', textAlign: 'center' }}>
            <h4 style={{ color: '#7c3aed', marginBottom: '10px', fontSize: '14px' }}>Payback</h4>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#7c3aed' }}>
              {economicResults.payback.toFixed(1)} anos
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderGraphsPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Gráficos</h3>
      {simulationHistory.length > 0 ? (
        <div style={{ border: '1px solid #d1d5db', padding: '20px', borderRadius: '4px' }}>
          <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Histórico de Recuperação</h4>
          <div style={{ display: 'flex', alignItems: 'end', height: '200px', gap: '4px' }}>
            {simulationHistory.map((sim, index) => {
              const height = (sim.recuperacao / 100) * 180;
              return (
                <div key={index} style={{ 
                  backgroundColor: '#4a90b8', 
                  height: `${height}px`, 
                  width: '15px', 
                  borderRadius: '2px 2px 0 0',
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'center',
                  paddingTop: '2px'
                }}>
                  <span style={{ fontSize: '6px', color: 'white' }}>
                    {sim.recuperacao.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '10px', textAlign: 'center' }}>
            Últimas {simulationHistory.length} simulações
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#6b7280' }}>Sem Dados</h3>
          <p style={{ fontSize: '14px' }}>Execute simulações para gerar gráficos</p>
        </div>
      )}
    </div>
  );
  
  const renderOptimizationPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Otimização</h3>
      
      <div style={{ border: '1px solid #d1d5db', padding: '20px', borderRadius: '4px', marginBottom: '25px' }}>
        <h4 style={{ color: '#2563eb', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Objetivos</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Recuperação Alvo (%):</label>
            <input
              type="number"
              value={optimizationParams.targetRecovery || ""}
              onChange={(e) => setOptimizationParams(prev => ({ ...prev, targetRecovery: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="85"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Teor Mínimo (%):</label>
            <input
              type="number"
              value={optimizationParams.minGrade || ""}
              onChange={(e) => setOptimizationParams(prev => ({ ...prev, minGrade: parseFloat(e.target.value) || 0 }))}
              style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '2px', fontSize: '12px' }}
              placeholder="60"
            />
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={optimizeParameters}
            style={{ padding: '8px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer', marginRight: '10px' }}
          >
            Otimizar
          </button>
          <button 
            onClick={calculateBalance}
            style={{ padding: '8px 16px', backgroundColor: '#4a90b8', color: 'white', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
          >
            Recalcular
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderReportsPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Relatórios</h3>
      
      {results ? (
        <div style={{ border: '1px solid #d1d5db', padding: '20px', borderRadius: '4px' }}>
          <h4 style={{ color: '#2563eb', marginBottom: '15px', fontSize: '14px', fontWeight: '600' }}>Resumo</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <p><strong>Capacidade:</strong> {results.alimentacao.vazao.toFixed(0)} t/h</p>
            <p><strong>Recuperação:</strong> {results.recuperacao.toFixed(2)}%</p>
            <p><strong>Enriquecimento:</strong> {results.razaoConcentracao.toFixed(1)}x</p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#6b7280' }}>Sem Dados</h3>
          <p style={{ fontSize: '14px' }}>Execute uma simulação primeiro</p>
        </div>
      )}
    </div>
  );

  const renderHelpPanel = () => (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Teoria e Parâmetros</h3>
      
      <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Equações de Balanço de Massa</h4>
          <p style={{ marginBottom: '10px', color: '#6b7280' }}>
            O balanço de massa é baseado no princípio de conservação da massa:
          </p>
          <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
            <p>Balanço total: F = C + T</p>
            <p>Balanço de componente: F × f = C × c + T × t</p>
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
            Onde: F = alimentação, C = concentrado, T = rejeito, f,c,t = concentrações
          </p>
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Parâmetros de Desempenho</h4>
          <div style={{ fontSize: '12px' }}>
            <p style={{ marginBottom: '8px' }}><strong>Recuperação:</strong> R = (C × c) / (F × f) × 100%</p>
            <p style={{ marginBottom: '8px' }}><strong>Razão de Concentração:</strong> RC = c / f</p>
            <p><strong>Eficiência de Separação:</strong> ES = R × (c - f) / (c × (100 - f))</p>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Aplicações</h4>
          <ul style={{ marginLeft: '20px', fontSize: '12px', color: '#6b7280' }}>
            <li>Dimensionamento de equipamentos de separação</li>
            <li>Otimização de circuitos de beneficiamento</li>
            <li>Controle de qualidade de processos</li>
            <li>Análise de viabilidade econômica</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Considerações Importantes</h4>
          <ul style={{ marginLeft: '20px', fontSize: '12px', color: '#6b7280' }}>
            <li>As concentrações devem ser fisicamente possíveis (concentrado {'>'} alimentação {'>'} rejeito)</li>
            <li>A densidade pode variar significativamente entre minérios diferentes</li>
            <li>Os resultados assumem estado estacionário do processo</li>
            <li>Fatores como umidade e perdas operacionais não são considerados</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenuItem) {
      case "simulacao":
        return renderSimulationPanel();
      case "resultados":
        return renderResultsPanel();
      case "parametros":
        return renderParametersPanel();
      case "economia":
        return renderEconomicsPanel();
      case "graficos":
        return renderGraphsPanel();
      case "otimizacao":
        return renderOptimizationPanel();
      case "relatorios":
        return renderReportsPanel();
      case "help":
        return renderHelpPanel();
      default:
        return (
          <div className="canvas">
            <div className="canvas-icon">⚙️</div>
            <div className="canvas-title">Área de Trabalho</div>
            <div className="canvas-subtitle">Selecione uma opção do menu</div>
          </div>
        );
    }
  };

  return (
    <div 
      className="simulator-container"
      onClick={hideContextMenu}
    >
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Moagem Simulator</div>
          <div className="sidebar-version">BALANÇO DE MASSA v4.0</div>
        </div>
        
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeMenuItem === "simulacao" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("simulacao")}
          >
            <Play size={14} />
            <span>Simulação</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "parametros" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("parametros")}
          >
            <Settings size={14} />
            <span>Parâmetros</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "resultados" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("resultados")}
          >
            <BarChart3 size={14} />
            <span>Resultados</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "economia" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("economia")}
          >
            <DollarSign size={14} />
            <span>Economia</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "graficos" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("graficos")}
          >
            <TrendingUp size={14} />
            <span>Gráficos</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "otimizacao" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("otimizacao")}
          >
            <Zap size={14} />
            <span>Otimização</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "relatorios" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("relatorios")}
          >
            <FileText size={14} />
            <span>Relatórios</span>
          </button>
          
          <button 
            className={`menu-item ${activeMenuItem === "help" ? "active" : ""}`}
            onClick={() => setActiveMenuItem("help")}
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          <button className="toolbar-btn" onClick={calculateBalance}>
            <Play size={12} />
            Executar Simulação
          </button>
          <button className="toolbar-btn">
            <FileSpreadsheet size={12} />
            Exportar Excel
          </button>
          <button className="toolbar-btn" onClick={clearCanvas}>
            <Trash2 size={12} />
            Limpar Fluxograma
          </button>
          <button className="toolbar-btn" onClick={() => setActiveMenuItem("resultados")}>
            <BarChart3 size={12} />
            Balanço de Massa
          </button>
        </div>

        {/* Workspace Area */}
        <div className="workspace-area">
          {/* Main Content Area */}
          <div className="canvas-area">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}