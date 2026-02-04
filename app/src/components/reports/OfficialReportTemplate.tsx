/**
 * Official Report PDF Template
 * 
 * Professional PDF template for price research reports using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ReportData } from '@/types/report';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderBottom: '2 solid #2563eb',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 6,
    minHeight: 25,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 6,
    backgroundColor: '#f8fafc',
    minHeight: 25,
  },
  colDescription: {
    width: '35%',
    paddingRight: 5,
  },
  colPrice: {
    width: '12%',
    textAlign: 'right',
    paddingRight: 5,
  },
  colUnit: {
    width: '10%',
    textAlign: 'center',
  },
  colSource: {
    width: '18%',
    paddingRight: 5,
  },
  colDate: {
    width: '12%',
    textAlign: 'center',
  },
  colOrgan: {
    width: '13%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statBox: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    border: '1 solid #cbd5e1',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #cbd5e1',
    paddingTop: 10,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  methodology: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    border: '1 solid #e2e8f0',
  },
  sourceList: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#475569',
  },
});

interface OfficialReportTemplateProps {
  data: ReportData;
}

export const OfficialReportTemplate: React.FC<OfficialReportTemplateProps> = ({
  data,
}) => {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const config = data.config || {};
  const includeMethodology = config.includeMethodology !== false;
  const includeStatistics = config.includeStatistics !== false;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {config.title || 'Pesquisa de Preços - Relatório Oficial'}
          </Text>
          <Text style={styles.subtitle}>
            Termo pesquisado: {data.searchTerm}
          </Text>
          <Text style={styles.subtitle}>
            Data de geração: {formatDateTime(new Date())}
          </Text>
          {config.organName && (
            <Text style={styles.subtitle}>Órgão: {config.organName}</Text>
          )}
          {config.processNumber && (
            <Text style={styles.subtitle}>
              Processo: {config.processNumber}
            </Text>
          )}
        </View>

        {includeMethodology && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metodologia</Text>
            <View style={styles.methodology}>
              <Text>
                Esta pesquisa de preços foi realizada através de consulta
                automatizada às seguintes fontes oficiais:
              </Text>
              <Text>{'\n'}</Text>
              <View style={styles.sourceList}>
                {data.sources.map((source, idx) => (
                  <Text key={idx}>• {source}</Text>
                ))}
              </View>
              <Text>{'\n'}</Text>
              <Text>
                Os dados apresentados refletem cotações públicas disponíveis
                na data de geração deste relatório. Foram encontrados{' '}
                {data.resultsCount} resultado(s) para o termo pesquisado.
              </Text>
            </View>
          </View>
        )}

        {includeStatistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Preço Médio</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(data.statistics.average)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Preço Mediano</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(data.statistics.median)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Menor Preço</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(data.statistics.lowest)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Maior Preço</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(data.statistics.highest)}
                </Text>
              </View>
            </View>
            {config.referenceMethod && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.text, styles.boldText]}>
                  Preço de Referência Sugerido:{' '}
                  {formatCurrency(
                    config.referencePrice || data.statistics.average
                  )}{' '}
                  (Método: {config.referenceMethod})
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Resultados Encontrados ({data.results.length})
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Descrição</Text>
              <Text style={styles.colPrice}>Preço</Text>
              <Text style={styles.colUnit}>Unidade</Text>
              <Text style={styles.colSource}>Fonte</Text>
              <Text style={styles.colDate}>Data</Text>
              <Text style={styles.colOrgan}>Órgão</Text>
            </View>

            {data.results.map((result, index) => (
              <View
                key={index}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colDescription}>
                  {result.description.substring(0, 60)}
                  {result.description.length > 60 ? '...' : ''}
                </Text>
                <Text style={styles.colPrice}>
                  {formatCurrency(result.price)}
                </Text>
                <Text style={styles.colUnit}>{result.unit}</Text>
                <Text style={styles.colSource}>{result.source}</Text>
                <Text style={styles.colDate}>
                  {formatDate(result.quotationDate)}
                </Text>
                <Text style={styles.colOrgan}>
                  {result.organ
                    ? result.organ.substring(0, 25)
                    : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {config.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.text}>{config.observations}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            Gerado pelo sistema Licita Preços em {formatDateTime(new Date())}
          </Text>
          <Text>
            ID da Pesquisa: {data.searchId} | Fontes consultadas:{' '}
            {data.sources.join(', ')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
