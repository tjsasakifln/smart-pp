'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import type { ReportConfig } from '@/types/report';

interface ReportConfigModalProps {
  searchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportConfigModal({ searchId, isOpen, onClose }: ReportConfigModalProps) {
  const [config, setConfig] = useState<ReportConfig>({
    organName: '',
    processNumber: '',
    observations: '',
    referenceMethod: 'median',
    includeMethodology: true,
    includeStatistics: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof ReportConfig>(
    field: K,
    value: ReportConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId, config }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar preview');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId, config }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${searchId}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personalizar Relatório">
      <div className="space-y-6">
        {/* Organ Name */}
        <div>
          <label htmlFor="organName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Órgão/Entidade
          </label>
          <input
            id="organName"
            type="text"
            value={config.organName || ''}
            onChange={(e) => handleChange('organName', e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Prefeitura Municipal de São Paulo"
          />
        </div>

        {/* Process Number */}
        <div>
          <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Número do Processo (opcional)
          </label>
          <input
            id="processNumber"
            type="text"
            value={config.processNumber || ''}
            onChange={(e) => handleChange('processNumber', e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 2026/0001"
          />
        </div>

        {/* Observations */}
        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">
            Observações/Justificativas
          </label>
          <textarea
            id="observations"
            value={config.observations || ''}
            onChange={(e) => handleChange('observations', e.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Adicione observações ou justificativas para este relatório..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {(config.observations || '').length}/1000 caracteres
          </p>
        </div>

        {/* Reference Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Referência de Preço
          </label>
          <div className="space-y-2">
            {[
              { value: 'average', label: 'Média Aritmética' },
              { value: 'median', label: 'Mediana (Recomendado)' },
              { value: 'lowest', label: 'Menor Preço' },
              { value: 'highest', label: 'Maior Preço' },
            ].map(method => (
              <label key={method.value} className="flex items-center">
                <input
                  type="radio"
                  name="referenceMethod"
                  value={method.value}
                  checked={config.referenceMethod === method.value}
                  onChange={(e) => handleChange('referenceMethod', e.target.value as ReportConfig['referenceMethod'])}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.includeMethodology}
              onChange={(e) => handleChange('includeMethodology', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Incluir seção de metodologia</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.includeStatistics}
              onChange={(e) => handleChange('includeStatistics', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Incluir estatísticas de preço</span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Gerando...' : 'Visualizar'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Gerando...' : 'Gerar PDF'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
